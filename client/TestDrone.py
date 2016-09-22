#!/usr/bin/python
import random
from Drone import Drone

name = raw_input("Name:")
something = raw_input("Refuel-dist:")
lat= raw_input("lat:")
lng= raw_input("long:")

d = Drone(random.randint(0,9),name,something,lat,lng)
print d.state
if d.is_not_registered():
	d.register()

if d.is_not_connected():
	d.connect()
