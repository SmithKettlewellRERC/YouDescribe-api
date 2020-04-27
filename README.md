# You Describe API

docker run -p 27017:27017 -v /Users/rodrigo/data/Dropbox/dev/youdescribe/api/db/var/:/data/db mongo

/auth
    POST
        /auth
        body json raw
            googleToken

/wishlist
    POST (add video to wish list)
        /wishlist
        body json raw
            youTubeId

    GET (get all items from wish list)
        /wishlist

    GET (get one item from wish list)
        /wishlist/:youtubeId
        body json raw
            youTubeId

    PUT (update wish list item)
        /wishlist/:youtubeId

/videos
    GET (get all videos)
        /videos

    GET (search)
        /videos/search

    GET (get on)
        /videos/:id

    GET (get videos by userId)
        /user/:userId

/audioclips
    POST (upload)
        /audioclips/:videoId
        body json raw
            userId
            userToken
            audioDescriptionId
            audioDescriptionNotes
            title
            description
            label
            playbackType
            startTime
            endTime
            duration
            file.size
            file.mimetype

    DELETE (delete)
        /audioclips/:audioClipId
        body json raw
            userId
            userToken

    PUT (update)
        /audioclips/:audioClipId
        body json raw
            userId
            userToken
            label

/users
    GET (Retrieve an user)
    /user/:userId

/audiodescriptions
    POST (To publish or unpublish an audio description)
        /audiodescriptions/:audioDescriptionId
        body json raw
            userId
            userToken
            action ('publish'|'unpublish')

    PUT (To update notes of audio descriptions)
        /audiodescriptions/:audioDescriptionId
        body json raw
            userId
            userToken
            notes

/audiodescriptionsrating
    POST
        /audiodescriptionsrating/:audioDescriptionId
        body json raw
            userId
            userToken
            rating
            feedback

## Authors

* **Curt Toppel** - [https://github.com/ctoppel](https://github.com/ctoppel)
* **Rodrigo Leme de Mello** - [https://github.com/lemerodrigo](https://github.com/lemerodrigo)
* **Trung Dinh** - [https://github.com/skykeeper0](https://github.com/skykeeper0)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.