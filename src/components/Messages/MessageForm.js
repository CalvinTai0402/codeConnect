import React from "react";
import { v4 as uuidv4 } from 'uuid';
import firebase from "../../firebase";
import { Segment, Button, Form, Grid } from "semantic-ui-react";
import FileModal from "./FileModal";
import ProgressBar from "./ProgressBar"

class MessageForm extends React.Component {
    state = {
        message: "",
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        loading: false,
        errors: [],
        modal: false,
        storageRef: firebase.storage().ref(),
        uploadTask: null,
        uploadState: "",
        percentUploaded: 0,
    };

    componentWillUnmount() {
        if (this.state.uploadTask !== null) {
            this.state.uploadTask.cancel();
            this.setState({ uploadTask: null });
        }
    }

    openModal = () => this.setState({ modal: true });

    closeModal = () => this.setState({ modal: false });

    handleChange = event => { this.setState({ [event.target.name]: event.target.value }) };

    createMessage = (fileUrl = null) => {
        const message = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            user: {
                id: this.state.user.uid,
                name: this.state.user.displayName,
                avatar: this.state.user.photoURL
            },
        };
        if (fileUrl !== null) {
            if (fileUrl.includes("jpg")) { message["image"] = fileUrl }
            else if (fileUrl.includes("mp4")) { message["video"] = fileUrl }
            else { message["pdf"] = fileUrl }
        } else {
            message["content"] = this.state.message;
        }
        return message;
    };

    sendMessage = () => {
        const { getMessagesRef } = this.props;
        const { message, channel } = this.state;
        if (message) {
            this.setState({ loading: true });
            getMessagesRef()
                .child(channel.id)
                .push()
                .set(this.createMessage())
                .then(() => {
                    this.setState({ loading: false, message: "", errors: [] });
                })
                .catch(err => {
                    this.setState({
                        loading: false,
                        errors: this.state.errors.concat(err)
                    });
                });
        } else {
            this.setState({
                errors: this.state.errors.concat({ message: "Add a message" })
            });
        }
    };

    getPath = () => {
        if (this.props.isPrivateChannel) {
            return `chat/private-${this.state.channel.id}`;
        } else {
            return "chat/public";
        }
    };

    uploadFile = (file, metadata, mediaType) => {
        const pathToUpload = this.state.channel.id;
        const messagesRef = this.props.getMessagesRef();
        let filePath = "";
        let basePath = this.getPath();
        if (mediaType === "image") { filePath = `${basePath}/${uuidv4()}.jpg` }
        else if (mediaType === "video") { filePath = `${basePath}/${uuidv4()}.mp4` }
        else { filePath = `${basePath}/${uuidv4()}.pdf`; }
        this.setState(
            {
                uploadState: "uploading",
                uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
            },
            () => {
                this.state.uploadTask.on("state_changed", snap => {
                    const percentUploaded = Math.round(
                        (snap.bytesTransferred / snap.totalBytes) * 100
                    );
                    this.setState({ percentUploaded });
                }, err => {
                    console.error(err);
                    this.setState({
                        errors: this.state.errors.concat(err),
                        uploadState: "error",
                        uploadTask: null
                    });
                }, () => {
                    this.state.uploadTask.snapshot.ref.getDownloadURL()
                        .then(downloadUrl => {
                            this.sendFileMessage(downloadUrl, messagesRef, pathToUpload)
                        })
                        .catch(err => {
                            console.error(err);
                            this.setState({
                                errors: this.state.errors.concat(err),
                                uploadState: "error",
                                uploadTask: null
                            });
                        });
                });
            }
        );
    };

    sendFileMessage = (fileUrl, messagesRef, pathToUpload) => {
        messagesRef.child(pathToUpload).push().set(this.createMessage(fileUrl))
            .then(() => {
                this.setState({ uploadState: "done" });
            })
            .catch(err => {
                console.error(err);
                this.setState({
                    errors: this.state.errors.concat(err)
                });
            });
    };

    render() {
        const { errors, message, modal, uploadState, percentUploaded } = this.state;
        return (
            <Segment className="message__form">
                <Grid columns="equal">
                    <Grid.Column>
                        <Form onSubmit={this.sendMessage} autoComplete="off">
                            <Form.Input
                                fluid
                                name="message"
                                style={{ marginBottom: "0.7em" }}
                                placeholder="Write your message"
                                className={errors.some(error => error.message.includes("message")) ? "error" : ""}
                                value={message}
                                onChange={this.handleChange} />
                        </Form>
                    </Grid.Column>
                    <Grid.Column width={4} >
                        <Button
                            content="Upload Media"
                            icon="cloud upload"
                            onClick={this.openModal}
                            disabled={uploadState === "uploading"}
                            fluid
                        />
                    </Grid.Column>
                </Grid>
                <FileModal
                    modal={modal}
                    closeModal={this.closeModal}
                    uploadFile={this.uploadFile}
                />
                <ProgressBar
                    uploadState={uploadState}
                    percentUploaded={percentUploaded} />
            </Segment >
        );
    }
}

export default MessageForm;
