<head>
  <style>
    a:hover {
      text-decoration: underline !important;
    }
    a:hover span {
      text-decoration: underline !important;
    }
  </style>
</head>
<body>
  <div class="container"
    style="
    font-family: sans-serif;
    color: #666;
    max-width: 500px;
    background-color: #fff;
  ">
    <div class="header"
      style="
      background-color: #00c1d5;
      padding: 0px 20px;
      height: 60px;
    ">
      <h1
        style="
        display: inline-block;
        color: #fff;
        font-weight: lighter;
        font-size: 23px;
        height: 21px;
        line-height: 21px;
        margin: 0px;
        vertical-align: middle;
        margin-top: 17px;
        padding-left: 5px;
      ">
        shoe<sup style="font-size: 11px;">&reg;</sup>
      </h1>
    </div>
    <div class="body"
      style="
      padding: 25px 0px 20px 0px;
      font-size: 14px;
    ">
      {{> @partial-block }}
      <div class="info-text"
        style="
        margin-top: 30px;
        border-top: 2px solid #111;
      ">
        <p style="color: #666; font-size: 13px;">
          Shoe Shine
        </p>
      </div>
    </div>
    <div class="footer"
      style="
      font-size: 10px;
      color: #000;
      background-color: #00c1d5;
      padding: 15px 40px;
      text-align: center;
      font-weight: lighter;
    ">
      <p>
        This is an email by The Shoe
      </p>
      <p>
        123 Main St<br />
        Shoeville, OR 97035<br />
        123.456.0000
      </p>
    </div>
  </div>
</body>
