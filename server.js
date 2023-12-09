const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const port = 3332;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));

const url = 'mongodb+srv://student:1234qwer@mydbforweb.ibitn9o.mongodb.net/?retryWrites=true&w=majority';

let mydb;

MongoClient.connect(url)
    .then((client) => {
        console.log('MongoDB에 연결되었습니다.');
        mydb = client.db('myboard'); // 'blog'는 사용할 데이터베이스 이름
    })
    .catch((error) => {
        console.error('MongoDB 연결 중 오류:', error);
    });


    let session = require('express-session');
    app.use(session({
      secret: 'asdfsdg',
      resave: false,
      saveUninitialized: true,
    }));

// EJS를 템플릿 엔진으로 설정
app.set('view engine', 'ejs');
let postcon;
// 블로그 포스트 메인 페이지
app.get('/', function (req, res) {
        console.log('인덱스 페이지 렌더링');
        let blogPosts =  mydb.collection('post').find().toArray()
        .then((result)=>{

            req.session.post=result
            console.log('인덱스 페이지 세션 :',req.session.post);
        res.render('index', {post: result });
        });

});

// 특정 포스트 보기
app.get('/post/:id', function (req, res) {
    
        let postId = req.params.id;
        console.log(postId);
        postId=new ObjectId(postId);
        console.log(postId);
        let post = mydb.collection('post').findOne({ _id: postId})
        .then((result)=>{
            console.log(result);
            res.render('post', { post:result })
        });
        
    
});

app.post('/login', (req, res) => {
    console.log('로그인 시도');
    mydb.collection('account').findOne({userid: req.body.userid})
  .then((result) => {
    console.log('result : ',result);
    console.log('로그인 시도 전 세션',req.session.post);
    if(result.userpw==req.body.userpw){
        const userId = req.body.userid;
        const userPw = req.body.userpw;
     // req.session.user=req.body;
      console.log('새로운 로그인');
      console.log('로그인 성공 세션',req.session.post[0]);
      res.render('index.ejs',{post: req.session.post});
    }else{
        console.log('로그인 실패');
        console.log('로그인 실패 세션',req.session.post);
      res.render('login.ejs',{post: req.session.post});
    }
  });

})

app.get('/login', (req, res)=>{
   res.render('login.ejs');
});

app.post('/register', (req, res) => {
    console.log('회원가입 시도');
    const newUser = {
        userid: req.body.username,
        userpw: req.body.password,
        // 필요에 따라 이메일 같은 다른 필드도 포함할 수 있습니다
        // email: req.body.email
    };

    // MongoDB 컬렉션 이름이 'account'라고 가정합니다
    mydb.collection('account').insertOne(newUser)
        .then(() => {
            console.log('회원가입 성공');
            // 필요하다면 여기서 새로운 사용자를 위한 세션 데이터를 설정할 수 있습니다

            // 회원가입 성공 시 로그인 페이지로 리다이렉션
            res.redirect('/login');
        })
        .catch((error) => {
            console.error('회원가입 실패:', error);
            res.render('register.ejs'); // 회원가입 페이지를 다시 렌더링하거나 에러를 적절히 처리하세요
        });
});

app.get('/register', (req, res)=>{
    res.render('register.ejs');
 });


app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

app.get('/test', (req,res) => {
    const filePath = path.join(__dirname, 'public', 'uploads', 'final.txt');

    fs.readFile(filePath, 'utf8', (err,data) => {
        if(err) {
            return res.status(500).send(err);
        }

        res.send(data);
    });
});

app.post('/test', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const uploadedFile = req.files.uploadedFile;
    const filePath = path.join(__dirname, 'public', 'uploads', 'final.txt');

    // 파일을 지정된 경로로 이동
    uploadedFile.mv(filePath, (err) => {
        if (err) { 
            return res.status(500).send(err);
        }
        res.send('File uploaded! You can access it at: http://localhost:3332/test');
    });
});

// 서버 시작
app.listen(port, function () {
    console.log("포트 3332 으로 서버 대기중 ... ");
  });