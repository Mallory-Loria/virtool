import asyncio
import logging
import os
import shutil
import sys
import tempfile

import virtool.app
import virtool.db.utils
import virtool.errors
import virtool.github
import virtool.http.proxy
import virtool.utils

logger = logging.getLogger(__name__)

INSTALL_PATH = sys.path[0]

SOFTWARE_REPO = "virtool/virtool"

RELEASE_KEYS = [
    "name",
    "body",
    "prerelease",
    "published_at",
    "html_url"
]


async def install(app, db, settings, loop, download_url, size):
    """
    Installs the update described by the passed release document.

    """
    with get_temp_dir() as tempdir:
        # Start download release step, reporting this to the DB.
        await update_software_process(db, 0, "download")

        # Download the release from GitHub and write it to a temporary directory.
        compressed_path = os.path.join(str(tempdir), "release.tar.gz")

        async def handler(progress):
            await update_software_process(db, progress)

        try:
            await virtool.github.download_asset(settings, download_url, size, compressed_path, progress_handler=handler)
        except virtool.errors.GitHubError:
            return await db.status.update_one({"_id": "software"}, {
                "$set": {
                    "process.error": "Could not find GitHub repository"
                }
            })
        except FileNotFoundError:
            return await db.status.update_one({"_id": "software"}, {
                "$set": {
                    "process.error": "Could not write to release download location"
                }
            })

        # Start decompression step, reporting this to the DB.
        await update_software_process(db, 0, "decompress")

        # Decompress the gzipped tarball to the root of the temporary directory.
        await loop.run_in_executor(None, virtool.github.decompress_asset_file, compressed_path, str(tempdir))

        # Start check tree step, reporting this to the DB.
        await update_software_process(db, 0, "check_tree")

        # Check that the file structure matches our expectations.
        decompressed_path = os.path.join(str(tempdir), "virtool")

        good_tree = await loop.run_in_executor(None, check_tree, decompressed_path)

        await db.status.update_one({"_id": "software"}, {
            "$set": {
                "process.good_tree": good_tree
            }
        })

        # Copy the update files to the install directory.
        await update_software_process(db, 0, "copy_files")

        await loop.run_in_executor(None, copy_software_files, decompressed_path, INSTALL_PATH)

        await db.status.update_one({"_id": "software"}, {
            "$set": {
                "process.complete": True
            }
        })

        await asyncio.sleep(1.5, loop=loop)

        await virtool.utils.reload(app)


def get_temp_dir():
    return tempfile.TemporaryDirectory()


async def update_software_process(db, progress, step=None):
    """
    Update the process field in the software update document. Used to keep track of the current progress of the update
    process.

    :param db: the application database client
    :type db: :class:`~motor.motor_asyncio.AsyncIOMotorClient`

    :param progress: the numeric progress number for the step
    :type progress: Union(int, float)

    :param step: the name of the step in progress
    :type step: str

    """
    return await virtool.utils.update_status_process(db, "software", progress, step)


def check_tree(path):
    if not {"client", "run", "VERSION"}.issubset(set(os.listdir(path))):
        return False

    client_content = os.listdir(os.path.join(path, "client"))

    if "favicon.ico" not in client_content or "index.html" not in client_content:
        return False

    if not any(["app." in filename and ".js" in filename for filename in client_content]):
        return False

    return True


def copy_software_files(src, dest):
    for dirname in ["templates", "lib", "client", "assets"]:
        shutil.rmtree(os.path.join(dest, dirname), ignore_errors=True)

    for name in os.listdir(src):
        src_path = os.path.join(src, name)
        dest_path = os.path.join(dest, name)

        if os.path.isfile(dest_path):
            os.remove(dest_path)

        if os.path.isfile(src_path):
            shutil.copy(src_path, dest_path)

        if os.path.isdir(dest_path):
            shutil.rmtree(dest_path)

        if os.path.isdir(src_path):
            shutil.copytree(src_path, dest_path)
