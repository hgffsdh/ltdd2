import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
export async function notifyParking(title,body){if(Platform.OS==='web')return; const p=await Notifications.getPermissionsAsync();if(p.status!=='granted')return;await Notifications.scheduleNotificationAsync({content:{title,body,sound:true},trigger:null});}
export async function requestNotifications(){if(Platform.OS==='web')return false;if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('default',{name:'Bãi xe',importance:Notifications.AndroidImportance.HIGH});return (await Notifications.requestPermissionsAsync()).status==='granted';}
