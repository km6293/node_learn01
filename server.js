// 라이브러리 참고
const express = require("express");
// 라이브러리를 이용해서 객체를 이용
const app = express();
// req에 있는 데이터를 좀 더 편하게 보기 위함
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
// mongoDB랑 연결
const MongoClient = require("mongodb").MongoClient;
// 서버데이터 집어넣어서 html 만드는 법 (ejs 활용)
// node 에서 ejs 사용시, 폴더 'view'안에 ejs 파일 넣어서 사용해야함.
app.set("view engine", "ejs");

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

// / = home -> 들어왔을때, index.html파일을 보여줘라
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// /pet 으로 들어오면 test를 보여줘라.
app.get("/write", (req, res) => {
  res.sendFile(__dirname + "/write.html");
});

// post
// req.body.name(작명) -> bodyParser 덕분에 name 으로 컨트롤 가능한듯
app.post("/add", (req, res) => {
  //쿼리문 같은 느낌 -> name = 게시물갯수 인 걸 찾아달라 느낌
  db.collection("counter").findOne({ name: "게시물갯수" }, (err1, res1) => {
    let resTotalPost = res1.totalPost + 1;

    // 저장할 데이터, (에러, 결과)
    db.collection("post").insertOne(
      { _id: resTotalPost, title: req.body.title, date: req.body.date },
      (err2, res2) => {
        console.log("저장완료");

        db.collection("counter").updateOne(
          { name: "게시물갯수" },
          { $inc: { totalPost: 1 } },
          (err3, res3) => {
            if (err3) return console.log(err3);
          }
        );
      }
    );
  });

  res.send("응답완료");
});

app.get("/list", (req, res) => {
  db.collection("post")
    .find()
    .toArray((err, result) => {
      console.log(result);
      res.render("list.ejs", { posts: result });
    });

  // 접속하면 렌더링 해줌
});
