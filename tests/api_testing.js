const supertest = require("supertest");

const request = supertest("http://localhost:8080/v1");

describe("Videos", () => {
  it("GET /videos", () => {
    request.get("/videos").end((err, res) => {
      if (err) console.log(err);
      let data = res.body.result;
      console.log("Videos Loaded: ", data.length);
      console.log("First Video Loaded: ", data[0].title);
      console.log("Last Video Loaded: ", data[data.length - 1].title);
      console.log(res.status);
    });
  });
});
