import { Dimensions } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import axios from 'axios';


import { isInProcess,setIsProcess } from '../../config';

export async function takePicture ( page_data ) {
  if (isInProcess==false) {
    setIsProcess(true)
    if (page_data.camera) {
      const data = await page_data.camera.takePictureAsync({ 
        quality: 0.2,
        base64: false
      });
      return data.uri
    }
  }
  return "not capture"
}

export async function cropFace( faceUri, top, left, height, width ) {
  var uri = false
  // Điều chỉnh lại thông số toạ độ khuôn mặt
  left = Dimensions.get('window').width-left-width
  if ((left+width)>Dimensions.get('window').width){
    width=Dimensions.get('window').width-left
  }
  try {
    console.log(Dimensions.get('window').width+"\t "+left+","+width)
    const manipResult = await manipulateAsync(
      faceUri,
      [
        {
          // Resize ảnh về đúng kích thước của màn hình điện thoại
          resize: {
            height: Dimensions.get('window').height,
            width: Dimensions.get('window').width
          }
        },
        {
          // cắt ảnh chứ khuôn mặt.
          crop: {
            height: height, 
            originX: left, 
            originY: top, 
            width: width
          }
        }
      ],
      // nén và định dạng ảnh lại
      { compress: 0.2, format: SaveFormat.PNG, base64: true}
    )
    uri = manipResult.uri
  } catch (e) {
    console.log(e)
    console.log('Error crop face error')
    uri = false
  }
  return uri
}

export async function getIndentity( imgUri ) {
  const bodyFormData = new FormData();
  bodyFormData.append('image', {
    uri:imgUri,
    name:'search.jpg',
    type:'image/png'
  });
  const res = await axios.post(
    "https://api-luanvan.hcm.unicloud.ai/ai/search",
    data = bodyFormData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
    ).then(res=>res.data)
  return res
}

