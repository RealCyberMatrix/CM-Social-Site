import jsonServer from 'json-server'
import path from 'path'

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'pseudo_data.json'))
const middlewares = jsonServer.defaults()

// const rewriter = jsonServer.rewriter({
//     'a': 'a',
//     'b': 'b'
// })

// server.use(rewriter)
server.use(router)
server.use(middlewares)
server.listen(5000, () => {
    console.log('JSON server is running at port: 5000')
})