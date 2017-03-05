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
    cursor.execute("SELECT movie_id, movie_name, movie_active, movie_media_id, movie_author, movie_created, movie_modified FROM movie")
    coll = db['movies']
    counter = 1
    for movie_id,movie_name,movie_active,movie_media_id,movie_author,movie_created,movie_modified in cursor:
        print 'Importing {}'.format(movie_id)
        status = 'published'
        if movie_active == 1:
            status = 'removed'
        movie = {
            '_id': movie_media_id,
            'old_id': movie_id,
            'title': movie_name,
            'created_at': movie_created,
            'updated_at': movie_modified,
            'views': 0,
            'language': 1,
            'status': status, #draft, #removed
            'audio_descriptions': {
                '1': {
                    'author': movie_author,
                    'likes': 0,
                    'clips': {}
                }
            },
            'notes': ''
        }
        # if counter > 2:
        #     break
        counter = counter + 1
        # print movie_name
        query = "select clip_id,clip_active,clip_filename,clip_start_time,clip_filename,clip_created,clip_modified,clip_download_count,clip_function from clip where movie_fk={}".format(movie_id)
        # print query
        cursor2.execute(query)
        clip_id_counter = 1
        for clip_id,clip_active,clip_filename,clip_start_time,clip_filename,clip_created,clip_modified,clip_download_count,clip_function in cursor2:
            print '--- clip: {}'.format(clip_id)
            clip = {
                'id': str(clip_id_counter), 
                'old_id': clip_id,
                'created_at': clip_created,
                'updated_at': clip_modified,
                # 'title': '',
                # 'downloads': clip_download_count,
                'type': clip_function.split('_')[1],
                'start_time': str(clip_start_time),
                'end_time': 0,
                'duration': 0,
                'filename': clip_filename,
            }
            movie['audio_descriptions']['1']['clips'][clip_id_counter] = clip
            clip_id_counter = clip_id_counter + 1
        print movie
        try:
            db.videos.insert_one(movie)
        except:
            print 'duplicate'
    cursor2.close()
    cursor.close()

if __name__ == '__main__':
    print 'Importing...'
    print
    # MYSQL
    conn = mysql.connector.connect(user='root', password='123456',host='127.0.0.1',database='youdescribe')

    # MONGO
    client = MongoClient()
    client = MongoClient("mongodb://127.0.0.1:27017")
    db = client['youdescribe']

    importVideos()
    importCountries()

    conn.close()
    print
    print 'Finished.'