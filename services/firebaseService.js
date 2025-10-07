// services/firebaseService.js
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadImageToFirebase = async (uri, path) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  
  await uploadBytes(storageRef, blob);
  
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
};