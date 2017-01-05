/**
 * @license
 * The MIT License (MIT)
 * Copyright 2015 Government of Canada
 *
 * @author
 * Ian Boyes
 *
 * @exports Security
 */

import React from "react";
import { Row, Col, Panel } from "react-bootstrap";
import Toggle from "react-bootstrap-toggle";
import { Icon, Flex, FlexItem, InputSave } from "virtool/js/components/Base";

const SecurityFooter = () => (
    <small className="text-warning">
        <Icon name="warning" /> Changes to these settings will only take effect when the server is reloaded.
    </small>
);

/**
 * A form component for setting whether an internal control should be used and which virus to use as a control.
 */
const Security = (props) => (
    <div>
        <Row>
            <Col md={6}>
                <Flex alignItems="center" style={{marginBottom: "10px"}}>
                    <FlexItem grow={1}>
                        <strong>SSL</strong>
                    </FlexItem>
                    <FlexItem>
                        <Toggle
                            on="ON"
                            off="OFF"
                            size="small"
                            active={props.settings.use_ssl}
                            onChange={() => props.set("use_ssl", !props.settings.use_ssl)}
                        />
                    </FlexItem>
                </Flex>
            </Col>
            <Col md={6} />
        </Row>
        <Row>
            <Col md={6}>
                <Panel>
                    <InputSave
                        label="Certificate Path"
                        onSave={event => props.set("cert_path", event.value)}
                        initialValue={props.settings.cert_path}
                        disabled={!props.settings.use_ssl}
                    />
                    <InputSave
                        label="Key Path"
                        onSave={event => props.set("key_path", event.value)}
                        initialValue={props.settings.key_path}
                        disabled={!props.settings.use_ssl}
                    />
                </Panel>
            </Col>
            <Col md={6}>
                <Panel footer={<SecurityFooter />}>
                    Configure the server to use SSL.
                </Panel>
            </Col>
        </Row>
    </div>
);

Security.propTypes = {
    set: React.PropTypes.func,
    settings: React.PropTypes.object
};

export default Security;