// src/lib/firebaseService.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
  type Auth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  type DocumentData,
  Firestore,
  QuerySnapshot,
  DocumentSnapshot,
  getDoc,
  setDoc,
  arrayUnion, 
  arrayRemove
} from "firebase/firestore";
import { writable, type Writable } from "svelte/store";

export interface CustomUser extends User {
    role: string;
  }

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// console.log(import.meta.env); // Debugging log

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  
console.log(firebaseConfig); // Debugging log

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);



// User store
export const user: Writable<CustomUser | null> = writable(null);

// Listen to auth state changes
// Handle authentication state changes
auth.onAuthStateChanged(async (firebaseUser: User | null) => {
    try {
    if (firebaseUser) {
      // Fetch the user's role from Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const customUser: CustomUser = { ...firebaseUser, role: userDoc.data()?.role || '' };
        user.set(customUser);
      } else {
        user.set(null);
      }
    } else {
      user.set(null);
    }
} catch (error) {
    console.error(error);
}
  });


export async function loginOrRegister(role?: string): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await setPersistence(auth, browserLocalPersistence); // Set persistence within login
    const result = await signInWithPopup(auth, provider);
    const loggedInUser = result.user;
    const userDocRef = doc(db, "users", loggedInUser.uid);

    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists() && role) {
      // New user, register with provided role
      await setDoc(userDocRef, { role });
      const customUser: CustomUser = { ...loggedInUser, role };
      user.set(customUser);
    } else if (userDoc.exists()) {
      // Existing user, set user data
      const customUser: CustomUser = { ...loggedInUser, role: userDoc.data()?.role || '' };
      user.set(customUser);
    } else {
      // New user, no role provided
      user.set({ ...loggedInUser, role: 'unknown' } as CustomUser);
    }
  } catch (error) {
    console.error(error);
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth);
    user.set(null);
  } catch (error) {
    console.error(error);
  }
}
// Generic Firestore functions
export async function loadCollection(collectionName: string, userId?: string, extraKey?: string, extraValue?: string): Promise<DocumentData[]> {
    let q;
    if (userId && extraKey && extraValue) {
      q = query(collection(db, collectionName), where("userId", "==", userId), where(extraKey, "==", extraValue));
    } else if (userId) {
      q = query(collection(db, collectionName), where("userId", "==", userId));
    } else {
      q = query(collection(db, collectionName));
    }
    const querySnapshot: QuerySnapshot = await getDocs(q);
    const items: DocumentData[] = [];
    querySnapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Loaded collection: ${collectionName}`, items); // Debugging log
    return items;
  }

export async function addItem(collectionName: string, item: DocumentData): Promise<void> {
  await addDoc(collection(db, collectionName), item);
  console.log(`Item added to ${collectionName}:`, item); // Debugging log
}

export async function updateItem(collectionName: string, id: string, item: DocumentData): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, item);
  console.log(`Item updated in ${collectionName}:`, id); // Debugging log
}

export async function deleteItem(collectionName: string, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
  console.log(`Item deleted from ${collectionName}:`, id); // Debugging log
}


export async function createTaskAssignment(classId: string) {
    const docRef = doc(db, "taskAssignments", classId);
    await setDoc(docRef, {
      classId: classId,
      taskIds: []
    });
  }

// 

export async function addTaskAssignment(classId: string, taskIds: string[], userId: string) {
    const docRef = doc(db, "taskAssignments", classId);
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
        console.log("docSnap.exists()"); // Debugging log
      await updateDoc(docRef, {
        taskIds: arrayUnion(...taskIds),
        userId: userId
      });
    } else {
        console.log("docSnap not exists()"); // Debugging log
      await setDoc(docRef, {
        classId: classId,
        taskIds: taskIds,
        userId: userId
      });
    }
  }

  export async function loadTaskAssignments(userId: string, classId?: string): Promise<DocumentData[]> {
    let q;
    if (classId) {
      q = query(collection(db, "taskAssignments"), where("__name__", "==", classId));
    } else {
      q = query(collection(db, "taskAssignments"), where("userId", "==", userId));
    }
  
    const querySnapshot = await getDocs(q);
    const items: DocumentData[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Loaded task assignments:`, items); // Debugging log
    return items;
  }

  // 
  export async function deleteTaskAssignment(classId: string, taskId: string): Promise<void> {
    try {
      const taskAssignmentDocRef = doc(db, "taskAssignments", classId);
  
      // Get the current task assignments
      const taskAssignmentDoc = await getDoc(taskAssignmentDocRef);
  
      if (taskAssignmentDoc.exists()) {
        // Check if the taskId exists in the taskIds array
        const taskAssignments = taskAssignmentDoc.data();
        if (taskAssignments.taskIds.includes(taskId)) {
          // Update the taskAssignments by removing the taskId
          await updateDoc(taskAssignmentDocRef, {
            taskIds: arrayRemove(taskId)
          });
          console.log(`Task ${taskId} removed from class ${classId}`); // Debugging log
        } else {
          console.log(`Task ${taskId} not found in class ${classId}`); // Debugging log
        }
      } else {
        console.error(`Task assignment document for class ${classId} does not exist.`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error removing task assignment:', error.message); // Detailed logging
      } else {
        console.error('Error removing task assignment:', error); // Handle unexpected types
      }
    }
  }
  
  
  export async function getSingleDoc(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error("No such document: " + docId);
    }
  }

  export async function addItemWithId(collectionName: string, docId: string, data: object) {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
  }