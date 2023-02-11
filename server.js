// 라이브러리 참고
const express = require("express");
// 라이브러리를 이용해서 객체를 이용
const app = express();
// req에 있는 데이터를 좀 더 편하게 보기 위함
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
// mongoDB랑 연결
const MongoClient = require("mongodb").MongoClient;
// method-override 는 html 에서 put / delete 요청 할 수 있는 라이브러리
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
// 서버데이터 집어넣어서 html 만드는 법 (ejs 활용)
// node 에서 ejs 사용시, 폴더 'view'안에 ejs 파일 넣어서 사용해야함.
app.set("view engine", "ejs");
// css 파일 넣을때..
app.use("/public", express.static("public"));


// env
require("dotenv").config();
var db;
MongoClient.connect(process.env.DB_URL, (err, client) => {
  if (err) return console.log(err);
  db = client.db("todoapp");

  // 서버를 열 수 있음.
  // (서버 띄울 포트번호, 띄운 후 실행할 코드) 
  app.listen(process.env.PORT, () => {
    console.log("listening on port");
  });
});

// html 파일 보낼때..
// res.sendFile(__dirname + "/index.html");

// / = home -> 들어왔을때, index.html파일을 보여줘라
app.get("/", (req, res) => {
  res.render("index.ejs", { data: res });
});

// /pet 으로 들어오면 test를 보여줘라.
app.get("/write", (req, res) => {
  res.render("write.ejs", { data: res });
});

app.get("/list", (req, res) => {
  db.collection("post")
    .find()
    .toArray((err, result) => {
      res.render("list.ejs", { posts: result });
    });

  // 접속하면 렌더링 해줌
});

app.get("/detail/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      if (err) return console.log(err);
      res.render("detail.ejs", { data: result });
    }
  );
});

app.get("/edit/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      if (err) return console.log(err);
      res.render("edit.ejs", { data: result });
    }
  );
});

app.put("/edit", (req, res) => {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    (err, result) => {
      console.log("수정완료");
      res.redirect("/list");
    }
  );
});

// session 방식 로그인 기능
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

// app.use(미들웨어)
// 미들웨어 : 요청 - 응답 중간에 뭔가 실행되는 코드
app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", (req, res) => {
  res.render("login.ejs", {});
});

app.post(
  "/login",
  passport.authenticate("local", {
    // 회원 인증 실패할 경우 fail 로 이동
    failureRedirect: "/fail",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("fail", (req, res) => {
  res.render("/");
});

app.get("/mypage", chkLogin, (req, res) => {
  res.render("mypage.ejs", { user: req.user });
});

app.get("/search", (req, res) => {
  let searchCondition = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: req.query.value,
          path: "title", // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        },
      },
    },
    { $sort: { _id: 1 } },
  ];
  db.collection("post")
    .aggregate()
    .toArray((err, result) => {
      res.render("list-filter.ejs", { posts: result });
    });
});

function chkLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

// LocalStrategy 인증 방식
passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (inputId, inputPw, done) {
      // console.log(inputId, inputPw);
      db.collection("login").findOne({ id: inputId }, function (err, result) {
        // done(서버에러, 성공시 사용자DB데이터, 에러메세지)
        if (err) return done(err);
        if (!result)
          return done(null, false, {
            message: "존재하지않는 아이디 입니다.",
          });
        return inputPw == result.pw
          ? done(null, result)
          : done(null, false, {
              message: "비밀번호를 다시 입력하여주세요.",
            });
      });
    }
  )
);

// 세션을 저장시키는 코드 (로그인 성공시 발동)
// user 은 LocalStrategy 인증 방식의 result 값이 들어감
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 이 세션 데이터를 가진 사람을 DB에서 찾아주세요 (마이페이지 접속 시, 발동)
passport.deserializeUser((id, done) => {
  db.collection("login").findOne({ id: id }, (err, result) => {
    done(null, result);
  });
});

app.post("/register", (req, res) => {
  db.collection("login").insertOne(
    { id: req.body.id, pw: req.body.pw },
    (err, result) => {
      res.redirect("/");
    }
  );
});

// post
// req.body.name(작명) -> bodyParser 덕분에 name 으로 컨트롤 가능한듯
app.post("/add", (req, res) => {
  //쿼리문 같은 느낌 -> name = 게시물갯수 인 걸 찾아달라 느낌
  db.collection("counter").findOne({ name: "게시물갯수" }, (err1, res1) => {
    let resTotalPost = res1.totalPost + 1;
    let saveVal = {
      _id: resTotalPost,
      title: req.body.title,
      date: req.body.date,
      writer: req.user._id,
    };
    // 저장할 데이터, (에러, 결과)
    db.collection("post").insertOne(saveVal, (err2, res2) => {
      console.log("저장완료");

      db.collection("counter").updateOne(
        { name: "게시물갯수" },
        { $inc: { totalPost: 1 } },
        (err3, res3) => {
          if (err3) return console.log(err3);
        }
      );
    });
  });

  // res.send("응답완료");
  console.log("작성완료");
  res.redirect("/list");
});

app.delete("/delete", (req, res) => {
  req.body._id = parseInt(req.body._id);
  let deleteData = { _id: req.bodt_id, writer: req.user._id };
  db.collection("post").deleteOne(deleteData, (err, result) => {
    if (err) return console.log(err);
    res.status(200).send({ message: "성공하였습니다." });
  });
});

// 특정경로일때만 미들웨어를 탐.
app.use("/", require("./routes/shop.js"));

let multer = require('multer');
// diskStorage 이미지를 어디다가 정의하는지
// memoryStorage 렘에다가 저장 -> 휘발성 있는것
var storage = multer.diskStorage({
  destination : (req, file, cd) => {
    // 폴더 안에 이미지 저장
    cd(null, './public/image')
  },
  filename : (req, file, cd) => {
    // 저장한 이미지의 파일명 설정하는 부분
    cd(null, file.originalname)
  }
})

var upload = multer({storage : storage})

app.get('/upload', (req, res) => {
  res.render('upload.ejs')
})

// multer 라이브러리-> 파일전송 쉽게 도와주는 라이브러리
app.post('/upload', upload.single('profile'), (req, res) => {
  res.send('응답완료');
})

// iamge/test.jpg -> 들어가짐
app.get('/image/:imageName', (req,res) => {
  res.sendFile(__dirname+'/public/image/' + req.params.imageName)
})