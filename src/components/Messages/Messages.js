import React from "react";
import { Segment, Comment } from "semantic-ui-react";
import MessagesHeader from "./MessagesHeader";
import MessageForm from "./MessageForm";
import Message from "./Message";
import firebase from "../../firebase";

class Messages extends React.Component {
  state = {
    usersRef: firebase.database().ref("users"),
    messagesRef: firebase.database().ref("messages"),
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    messages: [],
    messagesLoading: true,
    numUniqueUsers: "",
    searchTerm: "",
    searchLoading: false,
    searchResults: [],
    isPrivateChannel: this.props.isPrivateChannel,
    privateMessagesRef: firebase.database().ref("privateMessages"),
    isChannelStarred: false,
  };

  componentDidMount() {
    const { channel, user } = this.state;
    if (channel && user) { this.addListeners(channel.id, user.uid) }
  }

  addListeners = (channelId, userId) => {
    this.addMessageListener(channelId);
    this.addUserStarsListener(channelId, userId)
  };

  addMessageListener = channelId => {
    let loadedMessages = [];
    const ref = this.getMessagesRef();
    ref.child(channelId).on("child_added", snap => {
      loadedMessages.push(snap.val());
      this.setState({
        messages: loadedMessages,
        messagesLoading: false
      });
      this.countUniqueUsers(loadedMessages);
    });
  };

  addUserStarsListener = (channelId, userId) => {
    this.state.usersRef
      .child(userId)
      .child("starred")
      .once("value")
      .then(data => {
        if (data.val() !== null) {
          const channelIds = Object.keys(data.val());
          const prevStarred = channelIds.includes(channelId);
          this.setState({ isChannelStarred: prevStarred });
        }
      });
  };

  updateScroll = () => {
    let element = document.getElementById("messages_segment");
    element.scrollTop = element.scrollHeight;
    console.log(element.scrollTop)
  }

  countUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name);
      }
      return acc;
    }, []);
    const plural = uniqueUsers.length !== 1;
    const numUniqueUsers = `${uniqueUsers.length} user${plural ? "s" : ""}`;
    this.setState({ numUniqueUsers: numUniqueUsers });
  };

  displayMessages = messages => {
    return messages.length > 0 && messages.map(message => (
      <Message
        key={message.timestamp}
        message={message}
        user={this.state.user}
      />
    ));
  }

  displayChannelName = channel => {
    return channel ? `${this.state.isPrivateChannel ? "@" : "#"}${channel.name}` : "";
  };

  handleSearchChange = event => {
    this.setState(
      {
        searchTerm: event.target.value,
        searchLoading: true
      },
      () => this.handleSearchMessages()
    );
  };

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, "gi");
    const searchResults = channelMessages.reduce((acc, message) => {
      if ((message.content && message.content.match(regex)) || message.user.name.match(regex)) { acc.push(message) }
      return acc;
    }, []);
    this.setState({ searchResults: searchResults }, () => {
      this.setState({ searchLoading: false })
    });
  };

  getMessagesRef = () => {
    const { messagesRef, privateMessagesRef, isPrivateChannel } = this.state;
    return isPrivateChannel ? privateMessagesRef : messagesRef;
  };

  handleStar = () => {
    this.setState({ isChannelStarred: !this.state.isChannelStarred }, () => {
      this.starChannel();
    })
  }

  starChannel = () => {
    if (this.state.isChannelStarred) {
      this.state.usersRef.child(`${this.state.user.uid}/starred`).update({
        [this.state.channel.id]: {
          name: this.state.channel.name,
          details: this.state.channel.details,
          createdBy: {
            name: this.state.channel.createdBy.name,
            avatar: this.state.channel.createdBy.avatar
          }
        }
      });
    } else {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .child(this.state.channel.id)
        .remove(err => {
          if (err !== null) {
            console.error(err);
          }
        });
    }
  };

  render() {
    const { messagesRef, channel, user, messages, numUniqueUsers, searchTerm, searchResults, searchLoading, isPrivateChannel, isChannelStarred } = this.state;
    return (
      <React.Fragment>
        <MessagesHeader
          channelName={this.displayChannelName(channel)}
          numUniqueUsers={numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={searchLoading}
          isPrivateChannel={isPrivateChannel}
          isChannelStarred={isChannelStarred}
          handleStar={this.handleStar} />

        <Segment id="messages_segment">
          <Comment.Group className="messages">
            {searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
          </Comment.Group>
        </Segment>


        <MessageForm
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={user}
          isPrivateChannel={isPrivateChannel}
          getMessagesRef={this.getMessagesRef}
        />
      </React.Fragment>
    );
  }
}

export default Messages;
