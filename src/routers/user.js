const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const auth = require('../middlewares/auth')
const User = require('../models/user')
const { sendWelcomeEmail, sendGoodByeEmail } = require('../emails/account')

const router = new express.Router()
const avatar = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter (req, file, cb) {
        if(! file.originalname.match(/\.(jpg|jpeg|png)$/)) {
           return cb(new Error('Please upload a valid image file(jpg, jpeg or png)')) 
        }

        cb(undefined, true)
    }
})

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (err) {
        res.status(400).send({ error: err.message })
    }
}) 

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password) 
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (err) {
        res.status(400).send({ error: err.message })
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()
        res.send()
    } catch (err) {
        res.status(500).send({ error: err.message })
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (err) {
        res.status(500).send({ error: err.message })
    }
})

router.post('/users/me/avatar', auth, avatar.single('avatar'), async (req, res) => {
    const imgBuffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250,
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy
      }).png().toBuffer()
    req.user.avatar = imgBuffer
    await req.user.save()    
    res.send()   
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)   
})

router.get('/users/:id/avatar', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error('No image available')
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (err) {
        res.status(500).send({ error: err.message })
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'invalid updates!' })
    }

    try {        
        updates.forEach((update) => req.user[update] = req.body[update])

        await req.user.save()
        res.status(200).send(req.user)
    } catch (err) {
        res.status(400).send({ error: err.message })
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {        
        await req.user.remove()
        sendGoodByeEmail(req.user.email, req.user.name)
        res.send(req.user)        
    } catch (err) {
        res.status(500).send()
    }
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()    
    res.send()   
})

module.exports = router
