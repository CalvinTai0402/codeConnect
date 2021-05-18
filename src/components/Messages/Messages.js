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
    listeners: [],
    editedMessage: "",
    editedMessageId: null,
    editing: false
  };

  componentDidMount() {
    const { channel, user, listeners } = this.state;
    if (channel && user) { this.removeListeners(listeners); this.addListeners(channel.id, user.uid) }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.messagesEnd) {
      this.messagesEnd.scrollIntoView({ behavior: "smooth" })
    }
  }

  componentWillUnmount() {
    this.removeListeners(this.state.listeners);
  }

  removeListeners = listeners => {
    listeners.forEach(listener => {
      listener.ref.child(listener.id).off(listener.event);
    });
  };

  addToListeners = (id, ref, event) => {
    const index = this.state.listeners.findIndex(listener => {
      return (
        listener.id === id && listener.ref === ref && listener.event === event
      );
    });

    if (index === -1) {
      const newListener = { id, ref, event };
      this.setState({ listeners: this.state.listeners.concat(newListener) });
    }
  };

  addListeners = (channelId, userId) => {
    this.addMessageListener(channelId);
    this.addUserStarsListener(channelId, userId);
  };

  addMessageListener = channelId => {
    let loadedMessages = [];
    const ref = this.getMessagesRef();
    ref.child(channelId).on("child_added", snap => {
      loadedMessages.push(snap.val());
      console.log(loadedMessages)
      this.setState({
        messages: loadedMessages,
        messagesLoading: false
      });
      this.countUniqueUsers(loadedMessages);
    });

    ref.child(channelId).on("child_removed", async (snap) => {
      await this.popMessages(snap.val())
        .then((messages) => {
          this.setState({
            messages: messages,
            messagesLoading: false
          });
          this.countUniqueUsers(messages);
        })
    })

    ref.child(channelId).on("child_changed", async (snap) => {
      await this.editMessages(snap.val())
        .then((messages) => {
          this.setState({
            messages: messages,
            messagesLoading: false
          });
        })
    })

    this.addToListeners(channelId, ref, "child_added");
    this.addToListeners(channelId, ref, "child_removed");
    this.addToListeners(channelId, ref, "child_changed");
  };

  popMessages = async (message) => {
    let loadedMessages = this.state.messages;
    for (let i = 0; i < loadedMessages.length; i++) {
      if (loadedMessages[i].id === message.id) { loadedMessages.splice(i, 1); }
    }
    return loadedMessages
  }

  editMessages = async (message) => {
    let updatedMessages = this.state.messages;
    if (!this.state.editedMessage) return updatedMessages // weird fix for child_added
    for (let i = 0; i < updatedMessages.length; i++) {
      if (updatedMessages[i].id === message.id) { updatedMessages[i].content = this.state.editedMessage + " (Edited)"; }
    }
    this.setState({ editedMessage: "" })
    console.log(this.state.messages)
    return updatedMessages
  }

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
        style={{ position: "relative" }}
        dropdownOptions={this.dropdownOptions}
        channel={this.state.channel}
      />
    ));
  }

  dropdownOptions = (user, message, channel) => [
    {
      key: "edit",
      text: <span onClick={() => this.handleEdit(message)}>Edit Message</span>
    },
    {
      key: "delete",
      text: <span onClick={() => this.handleDelete(message, channel)}>Delete Message</span>
    }
  ];

  handleEdit = (message) => {
    if (message.user.id !== this.state.user.uid) {
      alert("Can't edit a message that is not yours")
    } else {
      let content = ""
      if (message.content.indexOf(" (Edited)") !== -1) {
        content = message.content.substring(0, message.content.indexOf(" (Edited)"));
      } else {
        content = message.content
      }

      this.setState({ editedMessage: content, editedMessageId: message.id, editing: true })
    }
  }

  handleDelete = (message, channel) => {
    if (message.user.id !== this.state.user.uid) {
      alert("Can't delete a message that is not yours")
    } else {
      this.state.messagesRef.child(channel.id).child(message.id).remove()
      this.setState({ editing: false, editedMessage: "", editedMessageId: null })
    }
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

  handleChange = event => { this.setState({ [event.target.name]: event.target.value }) };

  stopEditing = () => { this.setState({ editing: false }) }

  render() {
    const { messagesRef, channel, user, messages, numUniqueUsers, searchTerm, searchResults,
      searchLoading, isPrivateChannel, isChannelStarred, editedMessage, editedMessageId, editing } = this.state;
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

        <Segment className="messages_segment">
          <Comment.Group className="messages">
            {searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
            <div ref={node => { this.messagesEnd = node }}></div>
          </Comment.Group>
        </Segment>


        <MessageForm
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={user}
          isPrivateChannel={isPrivateChannel}
          getMessagesRef={this.getMessagesRef}
          editedMessage={editedMessage}
          editedMessageId={editedMessageId}
          handleChange={this.handleChange}
          editing={editing}
          stopEditing={this.stopEditing}
        />
      </React.Fragment>
    );
  }
}

export default Messages;
