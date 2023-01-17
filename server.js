// 라이브러리 참고
const express = require("express");
// 라이브러리를 이용해서 객체를 이용
const app = express();
// req에 있는 데이터를 좀 더 편하게 보기 위함
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// 서버를 열 수 있음.
// (서버 띄울 포트번호, 띄운 후 실행할 코드)
app.listen(8080, () => {
  console.log(1);
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
  res.send("응답완료");
});
