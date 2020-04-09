import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { createReference } from "../actions";
import { clearError } from "../../errors/actions";

import { Alert, Button, ButtonToolbar, DialogFooter } from "../../base";
import { getTargetChange } from "../../utils/utils";
import { DataTypeSelection } from "./DataTypeSelection";
import { ReferenceForm } from "./Form";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    margin: 15px;
`;

const getInitialState = () => ({
    name: "",
    description: "",
    dataType: "genome",
    organism: "",
    errorName: "",
    errorDataType: "",
    mode: "create"
});

export class CreateReference extends React.Component {
    constructor(props) {
        super(props);
        this.state = getInitialState();
    }

    handleChange = e => {
        const { name, value, error } = getTargetChange(e.target);

        this.setState({
            [name]: value,
            [error]: ""
        });
    };

    handleChangeDataType = dataType => {
        this.setState({ dataType });
    };

    handleSubmit = e => {
        e.preventDefault();

        if (!this.state.name.length) {
            this.setState({ errorName: "Required Field" });
        }

        if (!this.state.dataType.length) {
            this.setState({ errorDataType: "Required Field" });
        }

        if (this.state.name.length && this.state.dataType.length) {
            this.props.onSubmit(this.state.name, this.state.description, this.state.dataType, this.state.organism);
        }
    };

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <Container>
                    <Alert>
                        <strong>Create an empty reference.</strong>
                    </Alert>
                    <ReferenceForm
                        description={this.state.description}
                        errorFile={this.state.errorFile}
                        errorSelect={this.state.errorSelect}
                        errorName={this.state.errorName}
                        name={this.state.name}
                        mode={this.state.mode}
                        organism={this.state.organism}
                        onChange={this.handleChange}
                    />
                    <DataTypeSelection onSelect={this.handleChangeDataType} dataType={this.state.dataType} />
                </Container>
                <DialogFooter>
                    <ButtonToolbar>
                        <Button type="submit" icon="save" color="blue">
                            Save
                        </Button>
                    </ButtonToolbar>
                </DialogFooter>
            </form>
        );
    }
}

export const mapDispatchToProps = dispatch => ({
    onSubmit: (name, description, dataType, organism) => {
        dispatch(createReference(name, description, dataType, organism));
    },

    onClearError: error => {
        dispatch(clearError(error));
    }
});

export default connect(null, mapDispatchToProps)(CreateReference);
