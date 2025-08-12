// import React, { useEffect, useState } from "react";
// import { Button, TextInput, View, Text, ScrollView } from "react-native";

// export default function App() {
//   const [ws, setWs] = useState(null);
//   const [message, setMessage] = useState("");
//   const [received, setReceived] = useState("");
//   const [para,setPara] = useState("");
//   const [name,setName] = useState("");
//   const [alluser,setAllUsers] = useState([]);
  
  

//   useEffect(() => {
//     const socket = new WebSocket("ws://192.168.48.24:8085/ws");

//     socket.onopen = () => {
//       console.log("Connected to WebSocket server");
//     };

//     socket.onmessage = (event) => {
//       console.log("Message from server:", event.data);
//       const res = JSON.parse(event.data)
//       if(res[0] && res[0].type == "username"){
//         console.log(res)
//         setAllUsers(res)
//       }
//       if(res.type == "message"){
//         setReceived(res);
//       }
//     };

//     socket.onerror = (error) => {
//       console.log("WebSocket error:", error.message);
//     };

//     socket.onclose = (e) => {
//       console.log("WebSocket closed:", e.reason);
//     };

//     setWs(socket);

//     return () => {
//       socket.close();
//     };
//   }, []);


//   const sendMessage = () => {
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({
//         type:'message',
//         message
//       }))
//     }
//   };
//   const testSocket =()=>{
//     for (let i = 0; i < 500; i++) {
//       ws.send(JSON.stringify({
//         type:"username",
//         name : Math.floor(Math.random() * 101000)

//       }))
//     }
//   }



//   const sendName = () => {
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({
//         type:'username',
//         name
//       }))
//     }
//   };
//   return (
//     <View style={{ padding: 20 }}>
//       <ScrollView>
//       <TextInput
//         placeholder="Type a message"
//         value={message}
//         onChangeText={setMessage}
//         style={{
//           height: 40,
//           borderColor: "gray",
//           borderWidth: 1,
//           marginBottom: 10,
//           paddingHorizontal: 10,
//         }}
//       />
//       <Button title="Send Message" onPress={sendMessage} />
//       <Text style={{ marginTop: 20 }}>Server Response: {received.message}</Text>

//       <TextInput
//         placeholder="enter your name"
//         value={name}
//         onChangeText={setName}
//         style={{
//           height: 40,
//           borderColor: "gray",
//           borderWidth: 1,
//           marginBottom: 10,
//           paddingHorizontal: 10,
//         }}
//       />
//       <Button title="Submit Name" onPress={sendName} />
//       <Button title="test socket" onPress={testSocket} />
  
//       {alluser.map((userName)=>
//       <>
//       <Text key={userName} style={{ marginTop: 20,color:'white' }}>name {userName.name}</Text>
//       </>
      
//       )}
//         {/* <Text style={{ marginTop: 20 }}>name {alluser.name}</Text> */}
        
//       </ScrollView>
//     </View>
//   );
// }



import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { RTCView ,mediaDevices} from 'react-native-webrtc'

const App = () => {

  const [localMediaStream,setLocalMediaStream] = useState(null);
  const [allusers,setAllUsers] = useState([]);
  const [ws, setWs] = useState(null);
  const [remoteMediaStream,setRemoteMediaStream] = useState(null);
  const [name,setName] = useState("");
  
  useEffect(()=>{
    getLocalStream();
    const socket = new WebSocket("ws://192.168.48.24:8085/ws");
    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    }
    socket.onmessage = (event) => {
      console.log("Message from server:", event.data);
      const res = JSON.parse(event.data);
      if(res && res[0].type == "username"){
        console.log("All users : ",res)
        setAllUsers(res)
      }else{
        console.log("not a username");
      }
    }
    socket.onerror = (error) => { 
      console.log("WebSocket error:", error.message);
    }
    socket.onclose = (error) => {
      console.log("WebSocket closed", error.reason);
      setWs(null);
    }

    setWs(socket);
    
    return () => {
      socket.close();
    }
  },[])

  useEffect(()=>{
    console.log('localMediaStream : ',localMediaStream)
  },[localMediaStream])

  const getLocalStream = async ()=>{

    let mediaConstraints = {
      audio: true,
      video: {
        frameRate: 30,
        facingMode: 'user'
      }
    };

    let isVoiceOnly = false;
      
    try {
      const mediaStream = await mediaDevices.getUserMedia( mediaConstraints );
      
      if ( isVoiceOnly ) {
        let videoTrack = await mediaStream.getVideoTracks()[ 0 ];
        videoTrack.enabled = false;
      };
      
      setLocalMediaStream(mediaStream);
    } catch( err ) {
      console.log( 'Error: ', err );
    };

  }


  const postName = () => { 
    console.log("post name")
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type:'username',
        name
      }))
      console.log("name sent")
    }
  }
  const sendOffer = (userName) =>{
    console.log("send offer")
    console.log("userName : ",userName)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type:'offer',
        name:userName
      }))
      console.log("name sent")
    }
  }
  return (
    <View style={styles.container}>

      <Text style={{fontWeight:"bold",color:"red"}}> Webrtc Video Call App</Text>
      <TextInput placeholder='Enter your name' placeholderTextColor={'black'} style={{backgroundColor:'white',width:"80%",color:'black'}} onChangeText={setName}/>
      <Button onPress={postName} title='Submit Name '/>
      {allusers.map((username)=>

      <TouchableOpacity key={username.name} style={{backgroundColor:'white',width:"80%",justifyContent:'center',alignItems:'center',marginTop:4}}
        onPress={()=>sendOffer(username.name)}
      >
      <Text style={{color:"red"}}>{username.name}</Text>
      </TouchableOpacity>

      )}

      {localMediaStream ? <>
        <View>
        <Text style={{color:"red"}}>video available</Text>
        <RTCView
        style={{ width: 300/2, height: 400/2, backgroundColor: 'black' }}
        mirror={true}
        objectFit={'cover'}
        streamURL={localMediaStream.toURL()}
        zOrder={0}
        />
        </View>

      </>:<>
      <Text style={{color:"red"}}>local video not available</Text>
      </>
      }
      {remoteMediaStream ? <>
        <View>
        <Text style={{color:"red"}}>video available</Text>
        <RTCView
        style={{ width: 300/2, height: 400/2, backgroundColor: 'black' }}
        mirror={true}
        objectFit={'cover'}
        streamURL={remoteMediaStream.toURL()}
        zOrder={0}
        />
        </View>

      </>:<>
      <Text style={{color:"red"}}>Remote video not available</Text>
      </>
      }
    
    </View>
  )
}

export default App

const styles = StyleSheet.create({
  container:{
    flex:1,
    marginTop:10,
    alignItems:'center',
    justifyContent:'center'
  }
})