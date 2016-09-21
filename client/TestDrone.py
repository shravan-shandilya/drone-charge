#!/usr/bin/python
import random
from Drone import Drone

name = raw_input("NAme:")
something = raw_input("somehting:")
lat= raw_input("lat:")
lng= raw_input("long:")

d = Drone(random.randint(0,9),name,something,lat,lng)
if d.is_not_registered:
	print d.register()

if d.is_not_connected:
	print d.connect()
