
/*
Zeye Gu 101036562
Ziwen Wang 101071063


*/


const app = require('http').createServer(handler)
const io = require('socket.io')(app)
const fs = require("fs") //need to read static files
const url = require("url") //to parse url strings
const PORT = process.env.PORT || 3000

//server maintained location of moving box
 //will be over-written by clients

const ROOT_DIR = "html" //dir to serve static files from

const MIME_TYPES = {
  css: "text/css",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain"
}

function get_mime(filename) {
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES["txt"]
}

app.listen(PORT)

function handler(request, response) {
  let urlObj = url.parse(request.url, true, false)
  console.log('\n============================')
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let filePath = ROOT_DIR + urlObj.pathname
  if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

  fs.readFile(filePath, function(err, data) {
    if (err) {
      //report error to console
      console.log('ERROR: ' + JSON.stringify(err))
      //respond with not found 404 to client
      response.writeHead(404);
      response.end(JSON.stringify(err))
      return
    }
    response.writeHead(200, {
      'Content-Type': get_mime(filePath)
    })
    response.end(data)
  })

}

let red = null
let blue = null
let redname = ""
let bluename = ""
let onturn = false

io.on('connection', function(socket) {
	socket.emit('playername', JSON.stringify({red:redname, blue:bluename}))

	socket.on('clientSays', function(data) {
		console.log('RECEIVED: ' + data)
		
		io.emit('serverSays', data)
	})
	socket.on('move', function(data) {
		let obj = JSON.parse(data)
		if(obj.player != false) io.emit('move', JSON.stringify(obj.stones))
	})
	socket.on('reg', function(data) {
		let obj = JSON.parse(data)
		if(obj.player == "red" && red == null){
			console.log('' + obj.name + " become red")
			socket.emit('confirmreg', JSON.stringify({color:"red"}))
			red = socket
			redname = obj.name
			io.emit('playername', JSON.stringify({red:redname, blue:bluename}))
			if(!onturn){
				socket.emit('startturn', "")
				onturn = true
			}
		}
		else if(obj.player == "blue" && blue == null){
			console.log('' + obj.name + " become blue")
			socket.emit('confirmreg', JSON.stringify({color:"blue"}))
			blue = socket
			bluename = obj.name
			io.emit('playername', JSON.stringify({red:redname, blue:bluename}))
			if(!onturn){
				socket.emit('startturn', "")
				onturn = true
			}
		}else{
			socket.emit('confirmreg', JSON.stringify({color:""}))
		}
	})
	socket.on('finturn', function(data) {
		socket.emit('endturn', "")
		if (socket == red && blue != null){
			console.log("blue turn")
			blue.emit('startturn', "")}
		else if (socket == blue && red == null){
			console.log("blue turn")
			blue.emit('startturn', "")}
		else{
			console.log("red turn")
			red.emit('startturn', "")}
	})
	socket.on('dereg', function(data) {
		if (socket == red ){
			console.log('red: ' + redname + " quit")
			red = null
			redname = ""
			io.emit('playername', JSON.stringify({red:redname, blue:bluename}))
		}
		if (socket == blue){
			console.log('blue: ' + redname + " quit")
			blue = null
			bluename = ""
			io.emit('playername', JSON.stringify({red:redname, blue:bluename}))
		}
	})
})

console.log("Server Running at PORT: 3000  CNTL-C to quit")
console.log("To Test:")
console.log("Open several browsers at: http://localhost:3000/assignment3.html")
