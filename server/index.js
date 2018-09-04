const express = require('express')
const app = express()
const path = require('path')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const expressValidator = require('express-validator')
const jwt = require('jsonwebtoken')
const flash = require('connect-flash')
const morgan = require('morgan')

const {Server} = require('ws')


const mongoose = require('mongoose')
const passport = require('passport')
const http = require('http')
const PORT = 8080


app.use(morgan('dev'))
app.use(express.static('upload'))
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
app.use(cookieParser())

app.use(express.static(path.join(__dirname, '..', 'client', 'makaani', 'build')))

app.use(session({secret: 'secert', saveUninitialized: true, resave: true}))
app.use(expressValidator())

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())
app.server = http.createServer(app)

// start setup new websocket
app.wss = new Server({
  server: app.server
})

let clients = []
app.wss.on('connection', (connection) => {
  // console.log('New client connected', connection)
  const userId = clients.length + 1
  connection.userId = userId
  // console.log(connection.userId)

  const newClient = {
    ws: connection,
    userId: userId
  }
  clients.push(newClient)
  // console.log('New client connected with userId:', userId)

  connection.on('message', (message) => { // listen event new message from client
     // after getting new message from client, we send back to the client with new message
    // console.log('message from :', message)
    connection.send('server' + message)
  })
  connection.on('close', () => {
    // console.log('Client with ID' + '' + userId + '' + 'is disconnected')
    clients = clients.filter((client) => client.userId !== userId)
  })
})
app.get('/api/all_connections', (req, res, next) => {
  return res.json({
    people: clients
  })
})

setInterval(() => {   // each 3 seconds this function will executed
  // console.log(`There ${clients.length} clients is the connection`)
  if (clients.length > 0) {
    clients.forEach((client) => {
      // console.log('client ID', client.userId)
      // const msg = `${client.userId}: you get new message from server`
      // console.log(msg)
    })
  }
}, 3000)

app.use('*', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'makaani', 'build', 'index.html'))
})

app.server.listen(process.env.PORT || PORT, () =>
 console.log(`APP RUNNING ON PORT : ${app.server.address().port}`))