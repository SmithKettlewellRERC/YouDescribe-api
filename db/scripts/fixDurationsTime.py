
import wave
import contextlib
from pymongo import MongoClient
import os
import subprocess
import re

def main():
    base = '/Users/rodrigo/Desktop/youdescribe/api/uploads/legacy'
    acs = db.audio_clips.find({})
    acs_total = 0
    for ac in acs:
        if acs_total > 100000000:
            break
        # print ac
        path = base + '/' + ac['file_name']
        # print path
        command = ['/Users/rodrigo/Desktop/ffmpeg', '-i', path]
        p = subprocess.Popen(command, stderr=subprocess.PIPE)
        text = p.stderr.read()
        retcode = p.wait()
        text = text.decode('utf-8')
        p = re.compile(".*Duration:\s([0-9:\.]*),", re.MULTILINE|re.DOTALL)
        m = p.match(text)
        if m and m.group(1):
            duration = m.group(1)
            hms, ms = duration.split('.')
            h, m, s = hms.split(':')
            duration_float = float(str(int(h) * 3600 + int(m) * 60 + int(s)) + '.' + str(ms))
            end_time = ac['start_time'] + duration_float
            db.audio_clips.update_one({'_id':ac['_id']}, { '$set': {'duration': duration_float, 'end_time': end_time} })
            # print acs_total, '. ', ac['_id'], 'duration: ', duration, ' -> ', duration_float
        else:
            print 'removing {}'.format(ac['_id'])
            db.audio_clips.remove({'_id':ac['_id']})










        # with contextlib.closing(wave.open(path,'r')) as f:
        #     frames = f.getnframes()
        #     rate = f.getframerate()
        #     duration = frames / float(rate)
        #     print(duration)

        acs_total = acs_total + 1

if __name__ == '__main__':
    print 'Fixing times...'
    client = MongoClient("mongodb://127.0.0.1:27017")
    db = client['youdescribe']
    main()
    print 'Finished.'