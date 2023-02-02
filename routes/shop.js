var router = require("express").Router();

function chkLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

// shop.js에 있는 모든 미들웨어를 chkLogin으로 수정
router.use(chkLogin);

module.exports = router;
