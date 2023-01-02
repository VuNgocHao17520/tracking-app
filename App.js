import { React, useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';

import { box_style } from './components/styles/box-style';
import { styles } from './components/styles/camera_style';
import { setIsProcess } from './config';
import { cropFace, getIndentity, takePicture } from './components/functions/face';


export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [info_cu, setInfoCu] = useState({});
  const [type, setType] = useState(Camera.Constants.Type.front);
  const [face, setFace] = useState([]);

  const handleFacesDetected = async ({ faces }) => { 
    if (faces.length === 0) {
      setFace([]);
    }else {
      // *****Detect face from cammera 
      setFace(faces)
      var info_moi = {}
      for (let i=0; i<face.length; i++) {
        // *****Init face info variable if not exist
        Object.assign(info_moi,{[face[i].faceID]:face[i].faceID})
      }

      let keycu = Object.keys(info_cu)
      let valuecu = Object.values(info_cu)
      let keymoi= Object.keys(info_moi)
      // *****get list of face need to identity 
      let unregisteredkey = []
      for (let i =0; i<keymoi.length; i++){
        let existed = false
        for (let j=0; j<keycu.length; j++){
          if ((keycu[j]==keymoi[i])&&(keycu[j]!=valuecu[j])){
            existed=true
            Object.assign(
              info_moi,{[keymoi[i]]: Object.values(info_cu)[j]}
            );
          }
          if (existed) {
            break;
          }
        }
        if (existed==false) {
        unregisteredkey.push(keymoi[i]) 
        }
      }
      // *****if any ?
      if (unregisteredkey.length>0){
        let originUri = await takePicture( this );
        if (originUri!="not capture"){
          for (let i=0;i<keymoi.length;i++) {
            if (Object.values(info_moi)[i]==keymoi[i]){
              // *****resize, redefine coodinates, crop face
              let croppedUri = await cropFace(
                originUri,
                Math.floor(face[i].bounds.origin.y),
                Math.floor(face[i].bounds.origin.x),
                Math.floor(face[i].bounds.size.height),
                Math.floor(face[i].bounds.size.width)
              )
              // *****call backend api to identity face 
              if (croppedUri!=false){
                let res = await getIndentity(croppedUri)
                if (res.code==200){
                  console.log(res)
                  Object.assign(info_moi,{
                    [keymoi[i]]: res.data.face_name+": "+String((100*res.data.percent).toFixed(3))+"%"
                  })
                }
              }
              // *****update face variavles
            }
          }
          setIsProcess(false)
          setInfoCu(info_moi)
        }
      }
    };
   };

  const render_bouding_box = () => {
    temp = [];
    for (let i = 0; i<face.length; i++){
      temp.push(
        <View
        key={i}>
          <Text
            style={[ 
              box_style.name, 
              {
                'top': Math.floor(face[i].bounds.origin.y)-19,
                'left': Math.floor(face[i].bounds.origin.x),
              }
            ]}
          >
          {[Object.values(info_cu)[i]]}
          </Text>
          <View
            style={[ 
              box_style.box, 
              {
                'top': Math.floor(face[i].bounds.origin.y),
                'left': Math.floor(face[i].bounds.origin.x),
                'height': Math.floor(face[i].bounds.size.height),
                'width': Math.floor(face[i].bounds.size.width),
              }
            ]}
          >
          </View>
        </View>
      )
    };
    if (temp.length!=0) {
      return(temp);
    }else {
      return(<View></View>)
    }
   }

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera 
      style={styles.camera} 
      type={type}
      ref={(ref) => { this.camera = ref }}
      onFacesDetected={handleFacesDetected}
      faceDetectorSettings={{
        mode: FaceDetector.FaceDetectorMode.fast,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
        runClassifications: FaceDetector.FaceDetectorClassifications.none,
        minDetectionInterval: 100,
        tracking: true,
      }}
      >
        {render_bouding_box()}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setType(
                type === Camera.Constants.Type.front
                  ? Camera.Constants.Type.back
                  : Camera.Constants.Type.front
              );
            }}>
            <Text style={styles.text}> Flip </Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}
