import React from "react";
import mime from "mime-types";
import { Modal, Input, Button, Icon } from "semantic-ui-react";

class FileModal extends React.Component {
    state = {
        file: null,
        authorized: ["image/jpeg", "image/png", "image/gif", "application/pdf", "video/mp4", "video/quicktime"]
    };

    addFile = event => {
        const file = event.target.files[0];
        if (file) { this.setState({ file }) }
    };

    sendFile = () => {
        const { file } = this.state;
        const { uploadFile, closeModal } = this.props;

        if (file !== null) {
            if (this.isAuthorized(file.name)) {
                let mimeName = mime.lookup(file.name)
                const metadata = { contentType: mimeName };
                let mediaType = "pdf"
                if (["image/jpeg", "image/png", "image/gif"].includes(mimeName)) { mediaType = "image" }
                else if (["video/mp4", "video/quicktime"].includes(mimeName)) { mediaType = "video" }
                uploadFile(file, metadata, mediaType);
                closeModal();
                this.clearFile();
            } else {
                console.log(mime.lookup(file.name))
                alert("File type not supported. This website only supports .mov, .mp4, .gif, .png, .jpg, .jpeg, .pdf");
                closeModal();
                this.clearFile();
            }
        }
    };

    isAuthorized = filename => this.state.authorized.includes(mime.lookup(filename));

    clearFile = () => this.setState({ file: null });

    render() {
        const { modal, closeModal } = this.props;

        return (
            <Modal basic open={modal} onClose={closeModal}>
                <Modal.Header>Select an Image, Video or PDF File</Modal.Header>
                <Modal.Content>
                    <Input
                        onChange={this.addFile}
                        fluid
                        // label="Upload a file: "
                        name="file"
                        type="file"
                    />
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.sendFile} color="green" inverted>
                        <Icon name="checkmark" /> Send
                    </Button>
                    <Button color="red" inverted onClick={closeModal}>
                        <Icon name="remove" /> Cancel
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

export default FileModal;
