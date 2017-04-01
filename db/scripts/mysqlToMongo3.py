#!/usr/bin/python
import mysql.connector
from pymongo import MongoClient

# IMPORT USERS
def importMain():
    db.drop_collection("videos")
    db.drop_collection("users")
    db.drop_collection("audio_descriptions")
    cursor0 = conn.cursor(buffered=True)
    cursor1 = conn.cursor(buffered=True)
    cursor2 = conn.cursor(buffered=True)

    print 'Importing videos...'

    videos_counter = 0

    # Inserting videos
    cursor0.execute("SELECT movie_id, movie_name, movie_media_id, movie_author, movie_created, movie_modified FROM movie where length(movie_media_id) = 11 and movie_active = 1")
    for movie_id,movie_name,movie_media_id,movie_author,movie_created,movie_modified in cursor0:
        movie = {
            'youtube_id': movie_media_id,
            'legacy_video_id': movie_id,
            'title': movie_name,
            'description': '',
            'created_at': movie_created,
            'updated_at': movie_modified,
            'views': 0,
            'language': 1,
            # 'status': 'published',
            'audio_descriptions': [],
        }
        db.videos.insert(movie)
	print movie
        videos_counter = videos_counter + 1
    
    print 'Imported videos: {}'.format(videos_counter)

    print 'Importing users...'
    print 'Creating audio descriptions...'
    total_users = 0
    total_ads = 0

    # Inserting users
    cursor1.execute("Select distinct(u.user_email) as user_email, u.user_id, u.user_handle, u.user_modified, u.user_created from user as u,clip as c where u.user_email != '' and u.user_id = c.clip_author")

    for user_email, user_id, user_handle, user_modified, user_created in cursor1:
        if not user_created:
            user_created = user_modified = 20170317000000
        user = {
            'email': user_email,
            'name': user_handle,
            'google_user_id_token': '',
            'created_at': user_created,
            'updated_at': user_modified,
            'last_login': 0,
            'legacy_user_id': user_id,
        }
        res = db.users.insert_one(user)
        userId = res.inserted_id
        total_users = total_users + 1

        # Inserting audio descriptions
        cursor2.execute("select distinct(movie_fk), clip_author from clip where clip_active=1 and clip_author={}".format(user_id))
        for movie_fk,clip_author in cursor2:
            video = db.videos.find_one({'legacy_video_id': movie_fk})
            if video:
                if clip_author != 0:
                    ad = {
                        'user': userId,
                        'video': video['_id'],
                        'legacy_user_id': user_id,
                        'legacy_video_id': movie_fk,
                        'likes': 0,
                        'language': 1,
                        'audio_clips': [],
                        'notes': '',
                        'status': 'published',
                        'created_at': 20170317000000,
                        'update_at': 20170317000000
                    }
                    total_ads = total_ads + 1
                    res_ad = db.audio_descriptions.insert_one(ad)
                    adId = res_ad.inserted_id
                    # adId = {'_id':res_ad.inserted_id,'status':'published'}
                    # print adId, movie_fk
                    db.videos.update({'legacy_video_id': movie_fk}, { '$push': { 'audio_descriptions': adId } })
                

    print 'Users imported: {}'.format(total_users)
    print 'Audio descriptions created: {}'.format(total_ads)
    # print 'Cleaning videos...'

    # db.videos.remove({'audio_descriptions': { '$size': 0 }})
    # print 'Total videos after cleaning'
    # print db.videos.find({}).count()


# IMPORT AUDIO CLIPS
def importAudioClips():
    db.drop_collection("audio_clips")
    cursor10 = conn.cursor(buffered=True)
    cursor10.execute("select clip_id,movie_fk,clip_active,clip_filename,clip_start_time,clip_filename,clip_created,clip_modified,clip_download_count,clip_function,clip_author from clip")
    c=0
    print 'Importing audio clips...'
    for clip_id,movie_fk,clip_active,clip_filename,clip_start_time,clip_filename,clip_created,clip_modified,clip_download_count,clip_function,clip_author in cursor10:
        c = c + 1
        if clip_active != 1:
            continue
        user = db.users.find_one({'legacy_user_id': clip_author})
        video = db.videos.find_one({'legacy_video_id': movie_fk})
        ad = db.audio_descriptions.find_one({'legacy_video_id': movie_fk})

        if ad and video:
            clip = {
                'legacy_audio_clip_id': clip_id,
                'legacy_video_id': movie_fk,
                'legacy_user_id': clip_author,
                'audio_description': ad['_id'],
                'video': video['_id'],
                'label': '',
                'playback_type': clip_function.split('_')[1],
                'start_time': float(clip_start_time),
                'file_name': clip_filename,
                'file_size_bytes': 0,
                'file_mime_type:': 'audio/wav',
                'file_path': '/legacy',
                'created_at': clip_created,
                'updated_at': clip_modified,
                'end_time': '0',
                'duration': '0',
                'user': user['_id']
            }
            res = db.audio_clips.insert_one(clip)
            clipId = res.inserted_id
            ad = db.audio_descriptions.update({'legacy_video_id': movie_fk, 'legacy_user_id': clip_author},{ '$push': { 'audio_clips': clipId }}, True )
            print c, clip
    print 'Audio clips imported: {}'.format(c)

def cleaning():
    print 'Cleaning videos...'
    videos = db.videos.find({'audio_descriptions': {'$size': 0}})
    print 'Founded {} videos without audio descriptions'.format(videos.count())
    db.videos.remove({'audio_descriptions': {'$size': 0}})
    print 'Cleaning audio descriptions...'
    ads = db.audio_descriptions.find({'audio_clips': {'$size': 0}})
    print 'Founded {} audio_descriptions without audio clips'.format(ads.count())
    ads = db.audio_descriptions.remove({'audio_clips': {'$size': 0}})
    # print 'Cleaning audio clips...'
    #acs = db.audio_clips.find({})
    #acsOrphans = 0
    #for ac in acs:
    #    videoSearch = db.videos.find({'legacy_video_id': ac['legacy_video_id']})
    #    if videoSearch.count() == 0:
    #        acsOrphans = acsOrphans + 1
    #print 'Orphans audio clips: {}'.format(acsOrphans)


if __name__ == '__main__':
    print 'Connecting to mysql...'
    conn = mysql.connector.connect(user='root', password='123456',host='127.0.0.1',database='youdescribe')
    print 'mysql connected.'

    # MONGO
    print 'Connectiong to mongo...'
    client = MongoClient("mongodb://127.0.0.1:27017")
    # client = MongoClient("mongodb://youdescribe:EEwasdR7pbg6gyT@54.183.199.149:27017/youdescribe")
    db = client['youdescribe']
    print 'mongo connected.'

    importMain()
    importAudioClips()
    cleaning()

    conn.close()
    print
    print 'Finished.'
