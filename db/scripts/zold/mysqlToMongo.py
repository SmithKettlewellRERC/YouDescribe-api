#!/usr/bin/python
import mysql.connector
from pymongo import MongoClient

# IMPORT COUNTRIES
def importCountries():
    db.drop_collection("countries")
    cursor = conn.cursor()
    cursor.execute("SELECT country_id, country_name_short, country_name FROM country")
    coll = db['countries']
    counter = 0
    for country_id,country_name_short,country_name in cursor:
        print country_name
        counter += 1
        db.countries.insert_one({
            "id": country_id,
            "name": country_name,
            "code": country_name_short
        })
    cursor.close()
    print '{} countries imported.'.format(counter)

# IMPORT MOVIES
def importVideos():
    db.drop_collection("videos")
    cursor = conn.cursor(buffered=True)
    cursor2 = conn.cursor()
    cursor3 = conn.cursor()
    cursor.execute("SELECT movie_id, movie_name, movie_active, movie_media_id, movie_author, movie_created, movie_modified FROM movie")
    coll = db['videos']
    counter = 0
    for movie_id,movie_name,movie_active,movie_media_id,movie_author,movie_created,movie_modified in cursor:
        counter = counter + 1
        if counter > 5000:
            break
        if movie_media_id and len(movie_media_id) == 11 and movie_active == 1:
            pass
        else:
            continue
        author_name = ''
        author_email = ''
        if movie_author:
            cursor3.execute("Select user_email, user_handle from user where user_id={}".format(movie_author))
            row = cursor3.fetchone()
            if row and len(row) == 2:
                author_email = row[0]
                author_name = row[1]
        movie = {
            '_id': movie_media_id,
            'legacy_id': str(movie_id),
            'title': movie_name,
            'created_at': movie_created,
            'updated_at': movie_modified,
            'views': 0,
            'language': 1,
            'status': 'published',
            'audio_descriptions': {
                '1': {
                    'legacy_author_name': author_name,
                    'legacy_author_email': author_email,
                    'likes': 0,
                    'clips': {}
                }
            },
            'notes': ''
        }
        # print movie_name
        query = "select clip_id,clip_active,clip_filename,clip_start_time,clip_filename,clip_created,clip_modified,clip_download_count,clip_function from clip where movie_fk={}".format(movie_id)
        # print query
        cursor2.execute(query)
        clip_id_counter = 1
        for clip_id,clip_active,clip_filename,clip_start_time,clip_filename,clip_created,clip_modified,clip_download_count,clip_function in cursor2:
            clip = {
                'id': str(clip_id_counter), 
                'legacy_id': str(clip_id),
                # 'created_at': clip_created,
                # 'updated_at': clip_modified,
                'label': '',
                # 'downloads': clip_download_count,
                'playback_type': clip_function.split('_')[1],
                'file_size:': 0,
                'file_mime_type:': '',
                'file_size_bytes': 0,
                'file_path': '/legacy',
                'file_name': clip_filename,
                'start_time': str(clip_start_time),
                'end_time': 0,
                'duration': 0,
            }
            movie['audio_descriptions']['1']['clips'][str(clip_id_counter)] = clip
            clip_id_counter = clip_id_counter + 1

        if len(movie['audio_descriptions']['1']['clips'].keys()) > 0:
            print '{}. Importing movie_id: {}, youtube_id: {}, movie_active: {}'.format(counter, movie_id, 
            movie_media_id, movie_active)
            print
            print 'ID: {}'.format(movie['_id'])
            print
            # try:
            db.videos.insert_one(movie)
            # except:
            #     print 'ERROR ###'
    cursor2.close()
    cursor3.close()
    cursor.close()

if __name__ == '__main__':
    print 'Importing...'
    print
    # MYSQL
    conn = mysql.connector.connect(user='root', password='123456',host='127.0.0.1',database='youdescribe')

    # MONGO
    # client = MongoClient()
    client = MongoClient("mongodb://127.0.0.1:27017")
    db = client['youdescribe']

    importVideos()
    # importCountries()

    conn.close()
    print
    print 'Finished.'