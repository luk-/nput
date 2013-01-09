var ssh = require('ssh2')
var async = require('async')
var fs = require('fs')
var colors = require('colors')

var nput = {}

nput.start = function (options, cb) {
  console.log('Starting...'.green)
  var con = new ssh()
  con.connect({
    host: options.host,
    port: options.port,
    username: options.user,
    password: options.password
  })

  con.on('ready', function () {
    console.log('ssh connection successful.'.green)
    provision(options.os, options.node_version, con, cb)
  })
  con.on('error', function (err) {
    console.log(err)
    process.exit()
  })
}

function provision (options, node_version, ssh, cb) {
  var steps = []
  if (options.setup_steps.pre_dep) {
    steps.push(options.setup_steps.pre_dep)
  }
  steps.push(options.setup_steps.deps + ' '
           + options.dependencies.join(' '))

  options.setup_steps.post_deps.map(function (v) {
    v = v.replace(/node_src/g, node_version)
    steps.push(v)
  })
  build_async(steps, ssh, cb)
}

function build_async (steps, ssh, cb) {
  var con = ssh
  var steps_async = []

  steps.forEach(function (v) {
    steps_async.push(function (cb) {
  
      con.exec(v, function (err, stream) {
      	if (err) throw err
        stream.on('data', function (data, res) {
      	  console.log(data.toString())
    	  })
        stream.on('end', function () {
	        cb(null)
	      })
      })
      
    })
  })

  async.series(steps_async, function (err, res) {
    if (!err) {
      con.end()
      console.log('done'.green)
      cb()
    }
  })

}

module.exports = nput
