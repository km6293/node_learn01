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
      res.render("list.ejs", { posts: result });
    });

  // 접속하면 렌더링 해줌
});

app.delete("/delete", (req1, res1) => {
  req1.body._id = parseInt(req1.body._id);
  console.log(req1.body);
  db.collection("post").deleteOne(req1.body, (err2, res2) => {
    if (err2) return console.log(err2);
    res1.status(200).send({ message: "성공하였습니다." });
  });
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
