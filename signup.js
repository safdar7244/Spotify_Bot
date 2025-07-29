const puppeteer = require("puppeteer");
const request = require("request-promise-native");
const poll = require("promise-poller").default;
const chromeLocation = require("chrome-location");
const siteDetails = {
  sitekey: "",
  pageurl: "https://www.spotify.com/pk-en/signup/",
};

const apiKey = "";
const val = {
  email: "aLIkJJJII8899@gmail.com",
  confirm: "aLIkJJJII8899@gmail.com",
  password: "pkijWNNHU89",
  displayname: "The big K",
  day: "15",
  month: "October",
  year: "1999",
  gender: "male",
};
async function scrollDown(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}
async function scrollUp(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = document.body.scrollHeight;
      var distance = 100;
      var timer = setInterval(() => {
        window.scrollBy(0, -100);
        totalHeight -= distance;

        if (totalHeight <= 0) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

function getRandAfterDelay() {
  var min = 1000,
    max = 3000;
  return Math.floor(Math.random() * (max - min) + min);
}
const delay = {
  gender: { after: getRandAfterDelay() },
  marketing: { after: getRandAfterDelay() },
  third_party: { after: getRandAfterDelay() },
};

const chromeOptions = {
  executablePath: chromeLocation,
  headless: false,
  slowMo: 100,
  defaultViewport: null,
};

(async function main() {
  const browser = await puppeteer.launch(chromeOptions);

  const page = await browser.newPage();

  await page.goto("https://www.spotify.com/pk-en/signup/");

  const requestId = await initiateCaptchaRequest(apiKey);
  async function moveMouse(page) {
    await page.mouse.move(0, 0);
    await page.mouse.down();
    await page.mouse.move(0, 100);
    await page.mouse.move(100, 100);
    await page.mouse.move(100, 0);
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }

  await scrollDown(page).then(async () => {
    await page.waitForTimeout(4000);
  });
  // close cookies policy dialog box
  await page
    .evaluate(() => {
      document
        .querySelector(
          "#onetrust-consent-sdk > div:nth-child(3) > div > #onetrust-close-btn-container > button"
        )
        .click();
    })
    .then(async () => {
      await page.waitForTimeout(1000);
    });

  // scroll to top
  await scrollUp(page);
  // make some mouse movements
  await moveMouse(page);

  await page.type("#email", val.email);
  await page.type("#confirm", val.email);

  //   const password = getPassword;
  await page.type("#password", val.password);

  await page.type("#displayname", val.displayname);

  //   await page.type("#email_reg", "safdarnoobsparty@gmail.com");
  await page.type("#day", val.day);
  await page.type("#month", val.month);
  await page.type("#year", val.year);
  await scrollDown(page).then(async () => {
    await page.waitForTimeout(1000);
  });

  await page
    .evaluate(function (val) {
      var genderId =
        val.gender == "male" ? "gender_option_male" : "gender_option_female";
      document.querySelector(`#${genderId}`).click();
    }, val)
    .then(async () => {
      await page.waitForTimeout(delay.gender.after);
    });

  ///

  // select marketing checkbox
  await page
    .evaluate(() => {
      document.querySelector("#marketing-opt-checkbox").click();
    })
    .then(async () => {
      await page.waitForTimeout(delay.marketing.after);
    });

  // select third-party checkbox
  await page
    .evaluate(() => {
      document.querySelector("#third-party-checkbox").click();
    })
    .then(async () => {
      await page.waitForTimeout(delay.third_party.after);
    });
  const response = await pollForRequestResults(apiKey, requestId);
  console.log(response);
  await page.evaluate(
    `document.getElementById("g-recaptcha-response").innerHTML="${response}";`
  );

  await page.evaluate(() =>
    document
      .getElementsByName("recaptchaCheckbox")[0]
      .setAttribute("id", "newCaptcha")
  );

  await page.evaluate(
    () => (document.getElementsByName("recaptchaCheckbox")[0].hidden = false)
  );

  await page.type("#newCaptcha", "You've been approved  !", { delay: 0 });
  //   await page.evaluate((response) => {
  //     document.getElementsByName("recaptchaCheckbox")[0].value =
  //       "sfsdfsfsdfdsfsdfsdfd";
  //   }, response);

  //   await page.evaluate(
  //     // `document.getElementsByName("recaptchaCheckbox")[0].hidden=false;`
  //     // `document.getElementsByName("recaptchaCheckbox")[0].value="${response}";`

  //     alert("This message is inside an alert box")
  //   );

  await page.evaluate(() => {
    document.querySelector("button[type='submit']").click();
  });
})();

async function initiateCaptchaRequest(apiKey) {
  const formData = {
    method: "userrecaptcha",
    googlekey: siteDetails.sitekey,
    key: apiKey,
    pageurl: siteDetails.pageurl,
    json: 1,
  };
  const response = await request.post("http://2captcha.com/in.php", {
    form: formData,
  });
  return JSON.parse(response).request;
}

async function pollForRequestResults(
  key,
  id,
  retries = 30,
  interval = 1500,
  delay = 15000
) {
  console.log("key", key);
  console.log("req", id);
  await timeout(delay);
  return poll({
    taskFn: requestCaptchaResults(key, id),
    interval,
    retries,
  });
}

function requestCaptchaResults(apiKey, requestId) {
  const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
  return async function () {
    return new Promise(async function (resolve, reject) {
      const rawResponse = await request.get(url);
      const resp = JSON.parse(rawResponse);
      if (resp.status === 0) return reject(resp.request);
      resolve(resp.request);
    });
  };
}

const timeout = (millis) =>
  new Promise((resolve) => setTimeout(resolve, millis));

console.log("Script started...");
