const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const express = require('express');
const cors = require('cors');

// main app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
// database reference
const db = admin.firestore();
// routes
// creating a post
app.post('/api/v1/create', async (req, res) => {
  try {
    await db.collection('BlogPosts').doc(`/${Date.now()}/`).create({
      id: Date.now(),
      userId: req.body.userId,
      post: req.body.post,
    });
    return res.status(200).json({ status: 'success', message: 'post-created' });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: 'failure', message: 'could not create post' });
  }
});
// fetching the post
//1 fetching the post using specific id
app.get('/api/v1/get/:id', async (req, res) => {
  try {
    const reqParam = db.collection('BlogPosts').doc(req.params.id);
    const postDetail = await reqParam.get();
    const resData = postDetail.data();
    return res.status(200).json(resData);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: 'failure', message: 'could not get post' });
  }
});

// fetch all the posts from database
app.get('/api/v1/get', async (req, res) => {
  try {
    const query = db.collection('BlogPosts');
    let resData = [];
    await query.get().then((data) => {
      let docs = data.docs; // returns all the docs in the database
      // now we iterate one by one through each doc and push it to the array
      docs.map((doc) => {
        const item = {
          userId: doc.data().userId,
          post: doc.data().post,
        };
        // now pushing the objects to the array
        resData.push(item);
      });
      return resData;
    });
    res.status(200).json({ data: resData });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: 'failure', message: 'could not get all the post' });
  }
});

// fetching a post by specific userId
app.get('/api/v1/getUser/:id', async (req, res) => {
  try {
    const query = db.collection('BlogPosts');
    let resData=[];
    await query.get().then((data)=>{
      let docs=data.docs;
      docs.map((doc)=>{
        if(doc.data().userId===req.body.userId){
          const item = {
            userId:doc.data().userId,
            post:doc.data().post
          };
          resData.push(item);
        };
      });
      return resData;
    });
    if(resData.length!==0){
      return res.status(200).json({message:resData});
    }
    return res.status(404).json({ message: 'No user of that userId' });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 'failure', message: 'could not get post' });
  }
});
//updating the post only if the userId matches
app.patch('/api/v1/update/:id',async (req,res)=>{
  try {
    const reqData= db.collection('BlogPosts').doc(req.params.id);
   const editData=await reqData.get();
   const updatingUserId = editData.data();
  //  console.log(updatingUserId);
  if(updatingUserId.userId===req.body.userId){
    const editingData =  reqData.update({
      post: req.body.post
    })
    return res.status(200).json({status:"success",message:"user updated"});
   }
   return res.status(404).json({status:"failure",message: "not authorized to update"})
  } catch (error) {
    console.log(error);
    return res.status(500).json({status: "failure",message: "could not update the post"});
  }
})

//deleting the post only if the userid matches
app.delete('/api/v1/delete/:id', async (req,res)=>{
  try {
    const reqData =db.collection('BlogPosts').doc(req.params.id);
    const delData= await reqData.get();
    const deletingUserId = delData.data();
    if(deletingUserId.userId===req.body.userId){
      const deletedData= reqData.delete();
      return res.status(200).json({status:"success",message:"user deleted"});
    }

    return res.status(404).json({status:"failure",message: "not authorized to delete"})
  } catch (error) {
    console.log(error);
    return res.status(500).json({status: "failure",message: "could not delete the post"});
  }
})

// exporting the api to firebase cloud functions
exports.app = functions.https.onRequest(app);
