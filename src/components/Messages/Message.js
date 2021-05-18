import React from "react";
import moment from "moment";
import { Comment, Image, Dropdown } from "semantic-ui-react";
import ReactPlayer from 'react-player';
import { Document, Page, pdfjs } from 'react-pdf';
// import firebase from "../../firebase";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
// https://stackoverflow.com/questions/37760695/firebase-storage-and-access-control-allow-origin/37765371

const isOwnMessage = (message, user) => { return message.user.id === user.uid ? "message__self" : "" };
const isImage = message => { return message.hasOwnProperty("image") && !message.hasOwnProperty("content"); };
const isVideo = message => { return message.hasOwnProperty("video") && !message.hasOwnProperty("content"); };
const isPDF = message => { return message.hasOwnProperty("pdf") && !message.hasOwnProperty("content"); };
const timeFromNow = timestamp => moment(timestamp).fromNow();

const Message = ({ message, user, channel, dropdownOptions }) => (
    <Comment>
        <Comment.Avatar src={message.user.avatar} />
        <Comment.Content className={isOwnMessage(message, user)}>
            <Comment.Author as="a">{message.user.name}</Comment.Author>
            <Comment.Metadata>{timeFromNow(message.timestamp)}</Comment.Metadata>
            {isImage(message) ? (<Image src={message.image} className="message__image" />) :
                isVideo(message) ? (<ReactPlayer controls url={message.video} className="message__video" />) :
                    isPDF(message) ? (<a href={message.pdf} ><Document renderAnnotationLayer={false} className="message__pdf" file={{ url: message.pdf }}>
                        {"Click to see full PDF"}
                        <Page pageNumber={1} />
                    </Document></a>) :
                        (<Comment.Text>{message.content}</Comment.Text>)}
        </Comment.Content>
        <Dropdown
            simple
            direction='left'
            options={dropdownOptions(user, message, channel)}
            style={{
                position: "absolute",
                top: "0px",
                right: "20px",
            }}
        />
    </Comment >
);

export default Message;
