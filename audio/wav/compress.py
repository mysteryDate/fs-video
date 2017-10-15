import os

maxBR = 320
os.listdir('.')
files = [x for x in os.listdir('.') if x.endswith('wav')]

cmd = "lame -V 9 -b 0 -B {maxBR} {name}.wav {name}-{maxBR}.mp3"

for f in files:
  basename = f.split('.')[0]
  fullCmd = cmd.format(maxBR=maxBR, name=basename)
  os.system(fullCmd)
