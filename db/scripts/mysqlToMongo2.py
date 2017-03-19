#!/usr/bin/python
import mysql.connector
from pymongo import MongoClient

# IMPORT USERS
def importUsers():
    db.drop_collection("users")
    cursor = conn.cursor(buffered=True)

    # The users I need to insert into the database
    cursor.execute("Select distinct(u.user_email) as user_email, u.user_id, u.user_handle, u.user_modified, u.user_created from user as u,clip as c where u.user_email != '' and u.user_id = c.clip_author")

    counter = 0
    for user_email, user_id, user_handle, user_modified, user_created in cursor:
        if not user_created:
            user_created = user_modified = 20170317000000
        user = {
            'email': user_email,
            'name': user_handle,
            'created_at': user_created,
            'updated_at': user_modified,
            'legacy_id': user_id,
        }
        db.users.insert_one(user)
        counter = counter + 1
        print counter, user


# IMPORT MOVIES
def importVideos():
    db.drop_collection("videos")
    cursor = conn.cursor(buffered=True)
    cursor2 = conn.cursor(buffered=True)
    cursor3 = conn.cursor(buffered=True)
    counter = 0
    cursor.execute("SELECT movie_id, movie_name, movie_active, movie_media_id, movie_author, movie_created, movie_modified FROM movie")
    for movie_id,movie_name,movie_active,movie_media_id,movie_author,movie_created,movie_modified in cursor:
        # if counter > 100:
        #     break
        if movie_media_id and len(movie_media_id) == 11 and movie_active == 1:
            pass
        else:
            continue
        movie = {
            '_id': movie_media_id,
            'legacy_id': str(movie_id),
            'title': movie_name,
            'description': '',
            'created_at': movie_created,
            'updated_at': movie_modified,
            'views': 0,
            'language': 1,
            'status': 'published',
            'audio_descriptions': {},
            'notes': ''
        }
        counter = counter + 1
        # print counter, movie
        # print counter, query
        cursor2.execute("select clip_id,clip_active,clip_filename,clip_start_time,clip_filename,clip_created,clip_modified,clip_download_count,clip_function,clip_author from clip where movie_fk={}".format(movie_id))
        counter1=0
        for clip_id,clip_active,clip_filename,clip_start_time,clip_filename,clip_created,clip_modified,clip_download_count,clip_function,clip_author in cursor2:
            if clip_active != 1:
                continue
            counter1 = counter1 + 1
            adDesc = str(db.users.find_one({'legacy_id': clip_author})['_id'])
            if not movie['audio_descriptions'].has_key(adDesc):
                movie['audio_descriptions'][adDesc] = {
                    'likes': 0,
                    'clips': {},
                }
            unsortedKeys = movie['audio_descriptions'][adDesc]['clips'].keys()
            if (unsortedKeys):
                # print 'unsortedKeys: {}'.format(unsortedKeys)
                unsortedKeys.sort()
                nextClipId = int(unsortedKeys[-1]) + 1
            else:
                nextClipId = 1
            nextClipId = str(nextClipId)
            clip = {
                'id': str(nextClipId), 
                'legacy_id': str(clip_id),
                # 'created_at': clip_created,
                # 'updated_at': clip_modified,
                'label': '',
                # 'downloads': clip_download_count,
                'playback_type': clip_function.split('_')[1],
                'start_time': str(clip_start_time),
                'file_name': clip_filename,
                'file_size_bytes': 0,
                'file_mime_type:': '',
                'file_path': '/legacy',
                'created_at': clip_created,
                'end_time': 0,
                'duration': 0,
            }
            movie['audio_descriptions'][adDesc]['clips'][nextClipId] = clip

            # print counter1

            # print counter1, clip_start_time
        if len(movie['audio_descriptions'].keys()) > 0:
            db.videos.insert_one(movie)
            print movie

if __name__ == '__main__':
    print 'Importing...'
    print
    # MYSQL
    conn = mysql.connector.connect(user='root', password='123456',host='127.0.0.1',database='youdescribe')

    # MONGO
    client = MongoClient("mongodb://127.0.0.1:27017")
    db = client['youdescribe']

    importUsers()
    importVideos()

    conn.close()
    print
    print 'Finished.'