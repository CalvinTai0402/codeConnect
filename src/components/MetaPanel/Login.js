import React from "react"
import { Container } from "react-bootstrap"
import { Segment, Accordion, Header, Icon } from "semantic-ui-react";

const AUTH_URL =
  "https://accounts.spotify.com/authorize?client_id=b2bcbd97634e40f492c97636bf8540d6&response_type=code&redirect_uri=http://localhost:3000&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state%20user-top-read"

export default function Login() {
  return (

    <Segment >
      <Header as="h3" attached="top">
        Music lover?
      </Header>
      <Accordion styled attached="true">
        <Accordion.Title
          active="true"
          index={0}
        >
          {/* <Icon name="dropdown" /> */}
          <Icon name="info" />
        Connect to Spotify
      </Accordion.Title>
        <Accordion.Content active="true">
          <Container
            className="d-flex "
          // style={{ minHeight: "60vh" }}
          >
            <a className="btn btn-success btn-lg" href={AUTH_URL} style={{ color: "black" }}>
              Login With Spotify
            </a>
          </Container>
        </Accordion.Content>
      </Accordion>
    </Segment>
  )
}
