import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect ,useRef,useState} from 'react'
import { RTCView ,mediaDevices,RTCIceCandidate, RTCSessionDescription, RTCPeerConnection} from 'react-native-webrtc'

const App = () => {
    const [localMediaStream, setLocalMediaStream] = useState(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState(null);
    const [userName, setUserName] = useState("");   
    const [ws, setWs] = useState(null);
    const [allusers,setAllUsers] = useState([]);
    const pc = useRef(null);
    const callee = useRef(null);

    
    useEffect(()=>{
        
        if(localMediaStream){
            console.log("local stream is set");
            console.log("local stream : ",localMediaStream);
            if(!pc.current){
                setupWebRTC();
            }else{
                console.log("peer connection already established");
            }
        }else{
            console.log("local stream is not set");
        }

    },[localMediaStream])


    useEffect(() => {
        getLocalMediaStream();

        // const socket = new WebSocket("ws://192.168.98.24:8085/ws");

        socket.onopen = ()=>{
            console.log("Connected to WebSocket server");
        }
        socket.onmessage = async (event)=>{ 
            const res = JSON.parse(event.data);
            console.log("Message from server:", res);

            if(res && res.type == "userlist"){
                setAllUsers(res.users);
            }
            else if (res && res.type == "offer") {
                console.log("Offer received from : ", res.from);
                callee.current = res.from;

                try {
                    if (pc.current) {
                        await pc.current.setRemoteDescription(new RTCSessionDescription(res.offer));
                        const answer = await pc.current.createAnswer();
                        await pc.current.setLocalDescription(answer);
                        const data = {
                            type: "answer",
                            answer,
                            from: userName,
                            to: callee.current
                        }
                        socket.send(JSON.stringify(data));    
                        console.log("Answer sent to : ", data.to);
                                                
                    }else{
                        console.log("Peer connection not established");
                    }
                } catch (error) {
                    console.log("Error in setting remote description: ", error);
                }
                

            }
            else if (res && res.type == "answer") {
                console.log("Answer received: ", res);
                if (pc.current) {
                    pc.current.setRemoteDescription(new RTCSessionDescription(res.answer));
                    console.log("Remote description set");
                }
            }
            else if(res && res.type == "Icecandidate"){
                console.log("Ice candidate : ",res);
                try {
                    if(pc.current){
                        pc.current.addIceCandidate(new RTCIceCandidate(res.candidate));
                        console.log("Ice candidate added of peer connection");
                    }else{
                        console.log("Ice candidate Peer connection not established");
                    }
                } catch (error) {
                    console.log("error in adding ice candidate : ",error);
                }
            }
            else{
                console.log("not a username");
            }
        }
        socket.onerror = (error)=>{
            console.log("WebSocket error:", error.message);
        }
        setWs(socket);
    }, []);
    
    const setupWebRTC = () => {
        try {
            const peerConstraints = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    {
                        urls: "turn:relay1.expressturn.com:3478",
                        username: "efP1LUPHPXL09ERRTN",
                        credential: "S8dZLnys5SU7B8CU"
                    }
                ]
            };
            
            pc.current = new RTCPeerConnection(peerConstraints);
            console.log("Peer connection created");

            pc.current.onicecandidate = (event) => {
                console.log("ICE candidate send to ",callee.current);
                if (event.candidate) {
                    const data = {
                        type: "Icecandidate",
                        candidate: event.candidate,
                        from: userName,
                        to: callee.current
                    }
                    ws.send(JSON.stringify(data));
                }else{
                    console.log("No more ICE candidates");
                }
            }

            if (localMediaStream) {
                localMediaStream.getTracks().forEach(track => {
                  pc.current.addTrack(track, localMediaStream);
                });
                console.log('🎤 Local stream tracks added to peer connection');
            }else{
                console.log('🎤 Local stream tracks DOES NOT added to peer connection');
                console.log("localStream : ",localMediaStream)
            }
    
            pc.current.ontrack = (event) => {
                console.log("Remote track added: ", event.streams[0]);
                setRemoteMediaStream(event.streams[0]);
            }

            pc.current.onconnectionstatechange = () => {
                console.log("📶 Connection state:", pc.connectionState);
                if (pc.connectionState === "disconnected") {
                    console.log("Peer connection disconnected");
                    setRemoteMediaStream(null);
                }
            }
            // pc.onerror = (error) => {
            //     console.log("Peer connection error: ", error);
            // }
            // pc.oniceconnectionstatechange = () => {
            //     console.log("ICE connection state: ", pc.iceConnectionState);
            //     if (pc.iceConnectionState === "disconnected") {
            //         console.log("ICE connection disconnected");
            //         setRemoteMediaStream(null);
            //     }
            // }
            console.log("setupWebRTC running fine");
        } catch (error) {
            console.log("Error in setting up WebRTC: ", error);
        }
    }
    
    const getLocalMediaStream = async () => {
        let mediaConstraints = {
            audio: true,
            video: {
                frameRate: 30,
                facingMode: 'user'
            }
        };
        let isVoiceOnly = false;
          
        try {
            var mediaStream = await mediaDevices.getUserMedia( mediaConstraints );
          
            if ( isVoiceOnly ) {
                let videoTrack = await mediaStream.getVideoTracks()[ 0 ];
                videoTrack.enabled = false;
            };
            
            setLocalMediaStream(mediaStream);

        } catch( error ) {
            console.log("error in local stream : ",error)
        };
    }

    const submitUserName = () => {

        if(userName){
            console.log("userName : ",userName);
            const data = {
                type: "username",
                userName
            }
            ws.send(JSON.stringify(data));
        }else{
            alert("Please enter your name");
        }
    }
    
    const sendOffer = async (to) => {
        callee.current = to;

        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        console.log("send offer to : ",to);

        try {
            const data = {
                type: "offer",
                offer,
                from: userName,
                to,
            }
            ws.send(JSON.stringify(data));
        } catch (error) {
            console.log("error in sending offer : ",error);
        }
    }

  return (
    <View  alignItems='center' style={{flex:1,marginVertical:10}}>
        <View>
            <Text style={{fontWeight:'bold'}}> Webrtc App</Text>
        </View>
        <TextInput placeholder='enter your Name' style={{backgroundColor:"grey",width:'80%'}} onChangeText={setUserName}/>
        <Button 
        onPress={submitUserName}
        title='Submit Name'
        style={{backgroundColor:"blue",width:'80%'}}
        />

        {allusers.map((userName, index) => (
            <TouchableOpacity
                key={index}
                style={{
                backgroundColor: 'white',
                width: '80%',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 4,
                padding: 5,
                borderRadius: 6,
                }}
                onPress={() => sendOffer(userName)}
            >
                <Text style={{ color: 'black' }}>{userName} ☎️ </Text>
            </TouchableOpacity>
        ))}
        <View style={{justifyContent:'center',alignItems:'center',padding:10,backgroundColor:"green"}}>
            
            {localMediaStream? <>
                <Text style={{fontWeight:'bold'}}> YOU</Text>
                <RTCView
                    style={{width:200,height:200}}
                    streamURL={localMediaStream && localMediaStream.toURL()}
                    objectFit='cover'
                    mirror={true}
                    zOrder={0}  
                />
            </>:<></>}

            {remoteMediaStream? <>
                <Text style={{fontWeight:'bold'}}> YOUR FRIEND </Text>
                <RTCView
                    style={{width:200,height:200}}
                    streamURL={remoteMediaStream && remoteMediaStream.toURL()}
                    objectFit='cover'
                    mirror={true}
                    zOrder={0}  
                />
            </>:<></>}
    

        </View>

    </View>
  )
}

export default App

const styles = StyleSheet.create({})
