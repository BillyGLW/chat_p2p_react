import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Peer from 'peerjs';
import { Form, Avatar, Button, Badge, Grid,
		Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css'

const LOBBY_NAME = "react_simple_webrtc"
function LobbyList(props){
	const friends = props.friends;
	const listItems = friends.map((number) => 
		<li onClick={() => {document.getElementById('remotepeer').value=number;}} key={number}>{number}</li>
		);
	return (
		<ul> {listItems} </ul>
		);
}
function MessageList(props){
	const msg = props.msg;
	const history_msg = msg.map((number) => 
		<li key={number}> {number} </li>);
	return(
		<ul>
			{history_msg} 
		</ul>
		);
}
const states = {
  NOT_CONNECTED: "not_connected",
};

class Chat extends React.Component {
	componentDidMount() {
		console.log("trying to create lobby");

		let peers = {};
		// beware: may fail unless first user connected
		var lobby = new Peer(LOBBY_NAME);
		lobby.on('open', function(id) {
			console.log('Lobby peer ID is: ' + id);
		})

		lobby.on('connection', (conn) => {
			console.log('lobby connection', conn.peer);
			conn.on('data', (data) => {
				if (data === "READY"){
					peers[conn.peer] = (new Date()).getTime();
				}
				if (data === "QUERY"){
					conn.send(Object.keys(peers));
				}
			})
		})
	}
	render() {
		return(
			<div className="chat">
				<div className="chat-board">
					<App />
				</div>
			<div className="chat-info">
				<div> { /* status */ } </div>
				<ol> { /*   TODO  */ } </ol>
				</div>	
			</div>	
				); 
			}
	}

class App extends React.Component {
 	componentDidMount() {
	}
	constructor(props) {
		super(props);
		this.state = {
			msgs: [],
			from: '',
			to: '',
			peer: new Peer(),
			conn: null,
			peer_id: null,
			connState: states.NOT_CONNECTED,
			inlobby: [],
		};
    this.state.peer.on('open', (id) => {
      this.setState({peer_id: id});
      var lconn = this.state.peer.connect(LOBBY_NAME);
      lconn.on('open', () => {
        console.log("connected to lobby");
        var lobby_query = () => {
          lconn.send("QUERY");
          // if (this.state.connState === states.NOT_CONNECTED) {
          lconn.send("READY");
          // }
          window.setTimeout(lobby_query, 1000);
        }
        lobby_query();
      });
      lconn.on('data', (data) => {
        console.log("setting lobby", data);
        this.setState({inlobby: data});
      });
    });

    let chat_history = {}

    this.state.peer.on('connection', (conn) => {
      console.log("got connection from", conn.peer);
      if (this.state.conn == null) {
        this.setState({conn: conn});
        conn.on('data', (data) => {
        // TODO: move it into new func
          chat_history[data.msgs] = (new Date()).getTime()
          this.setState({msgs: Object.keys(chat_history),
          				from: data.author,});
          console.log('Received', data);
        });
      } else {
        console.log("already connected");
        conn.close();
      }
    });
  }
	connect() {
		var rp = document.getElementById("remotepeer").value;
		console.log("connect to", rp);
		var conn = this.state.peer.connect(rp);
		conn.on('open', () => {
			console.log("connection open");
			this.setState({conn: conn})
		});
		conn.on('data', (data) => {
			console.log('Received back', data);
			if (!this.state.xIsNext){
				// silence is golden
			}
		})
	}
	send(){
		this.state.conn.send({
			msgs: document.getElementById("msg_tosend").value,
			author: this.state.peer_id,
			});
		}

	render() 
		{
		return( 
			<div>
			<Form>
				<Form.Row>
					<Form.Group as={Col} controlId="formGridMessage">
						<Form.Check.Label> Message: </Form.Check.Label> 
						<Form.Check.Input type="message" isValid id="msg_tosend"/>
					</Form.Group>
					<Form.Group as={Col} controlId="formGridRecipient">
				<Form.Check.Label> Who: </Form.Check.Label> 
				<Form.Check.Input id="remotepeer" type="recipient" isValid disabled /> 
					</Form.Group>
				<Button variant="primary" onClick={() => this.connect()}> Connect </Button>

				</Form.Row>
			</Form>
				 <Button variant="primary" size="lg" onClick={() => this.send() }>
  						  Send
 						 </Button>
        	<div class="peer-id">My peer id is: <span class="id-code">{this.state.peer_id}</span></div>

	        <div class="lobby">
				<h3>Click a user to challenge</h3>
      		  <div class="list"><LobbyList friends={this.state.inlobby} /></div>
				<h3>Received messages</h3>
			  <div class="list">  
			     <h3>Author:{this.state.from}</h3> <MessageList msg={this.state.msgs} />
			   </div>

        	</div>
			</div>
			);
	}		

}

ReactDOM.render(<Chat />, document.getElementById('root'));

