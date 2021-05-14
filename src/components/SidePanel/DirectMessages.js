import React from 'react';
import { Menu, Icon } from 'semantic-ui-react';
import firebase from "../../firebase";
import { connect } from "react-redux";
import { setCurrentChannel, setPrivateChannel } from "../../actions";
class DirectMessages extends React.Component {
    state = {
        user: this.props.currentUser,
        users: [],
        usersRef: firebase.database().ref("users"),
        connectedRef: firebase.database().ref(".info/connected"), //checks if client is connected
        presenceRef: firebase.database().ref("presence"),
        activeChannel: null
    }

    componentDidMount() {
        if (this.state.user) {
            this.addListeners(this.state.user.uid);
        }
    }

    addListeners = currentUserUid => {
        let loadedUsers = [];
        this.state.usersRef.on("child_added", snap => {
            if (currentUserUid !== snap.key) {
                let user = snap.val();
                // console.log(user)
                user["uid"] = snap.key;
                user["status"] = "offline";
                loadedUsers.push(user);
                this.setState({ users: loadedUsers });
            }
        });

        this.state.connectedRef.on("value", snap => {
            if (snap.val() === true) {
                const ref = this.state.presenceRef.child(currentUserUid);
                ref.set(true);
                ref.onDisconnect().remove(err => {
                    if (err !== null) {
                        console.error(err);
                    }
                });
            }
        });

        this.state.presenceRef.on("child_added", snap => {
            if (currentUserUid !== snap.key) {
                this.addStatusToUser(snap.key, true);
            }
        });

        this.state.presenceRef.on("child_removed", snap => {
            if (currentUserUid !== snap.key) {
                this.addStatusToUser(snap.key, false);
            }
        });
    };

    addStatusToUser = (userId, connected = true) => {
        // const updatedUsers = this.state.users.reduce((acc, user) => {
        //     if (user.uid === userId) {
        //         user["status"] = `${connected ? "online" : "offline"}`;
        //     }
        //     console.log(acc)
        //     console.log(user)
        //     return acc.concat(user);
        // }, []);
        const updatedUsers = this.state.users;
        for (let i = 0; i < updatedUsers.length; i++) {
            let user = updatedUsers[i];
            if (userId === user.uid) {
                user["status"] = `${connected ? "online" : "offline"}`;
                break
            }
        }
        this.setState({ users: updatedUsers });
    };

    isUserOnline = user => user.status === "online";

    changeChannel = user => {
        const channelId = this.getChannelId(user.uid);
        const channelData = {
            id: channelId,
            name: user.name
        };
        this.props.setCurrentChannel(channelData);
        this.props.setPrivateChannel(true);
        this.setActiveChannel(user)
    };

    setActiveChannel = (user) => {
        this.setState({ activeChannel: user.uid })
    }

    getChannelId = userId => {
        const currentUserId = this.state.user.uid;
        return userId < currentUserId ? `${userId}/${currentUserId}` : `${currentUserId}/${userId}`;
    };

    render() {
        const { users, activeChannel } = this.state;

        return (
            <Menu.Menu className="menu">
                <Menu.Item>
                    <span> <Icon name="mail" /> DIRECT MESSAGES</span> {' '}({users.length})
                </Menu.Item>
                {users.map(user => (
                    <Menu.Item
                        key={user.uid}
                        onClick={() => this.changeChannel(user)}
                        style={{ opacity: 0.7, fontStyle: "italic" }}
                        active={user.uid === activeChannel}
                    >
                        <Icon
                            name="circle"
                            color={this.isUserOnline(user) ? "green" : "red"}
                        />
                    @ {user.name}
                    </Menu.Item>
                ))}
            </Menu.Menu>
        )
    }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(DirectMessages);