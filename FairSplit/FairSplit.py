import sys

numPeople = int(input("how many people to split between?\n"))
i = 1
l = []
totalCost = 0
while i<numPeople+1:
	person = input("Enter person #" + str(i) + "\n")
	cost = float(input("Enter cost for " + person + "\n"))
	totalCost += cost;
	lst = [0] * numPeople
	tuple = (person,cost,lst)
	tupleList = list(tuple)
	l.append(tupleList)
	i+=1

l.sort(key=lambda x: float(x[1]), reverse=True)
print(l)
#import copy
#originalList = copy.copy(l)

goal = float(totalCost/numPeople)
goal = float("{0:.2f}".format(goal))
print()
print("goal: " + str(goal))
print()
finishList = []

awayList = []
i = 0 #startPosition
finished = 0
endPos = len(l)-1
while finished<numPeople and i!=endPos:
	if(l[i][1] >=  goal-0.1 and l[i][1] <= goal+.01):
		i+=1
		finished += 1
		continue
	if(l[endPos][1] >=  goal-.01 and l[endPos][1] <= goal+.01):
		endPos-=1
		finished += 1
		continue
	iters = 0
	while(l[i][1]!=goal and l[endPos][1]!=goal):
		iters+=.01
		l[i][1]-= .01
		l[endPos][1] += .01
		l[i][1] = float("{0:.2f}".format(l[i][1])) 
		l[endPos][1] = float("{0:.2f}".format(l[endPos][1]))
	
	if((l[i][1] >=  goal-.01 and l[i][1] <= goal+.01) or (l[endPos][1] >=  goal-.01 and l[endPos][1] <= goal+.01)):
		l[i][2][endPos] = float("{0:.2f}".format(iters)) #where the current person "beg" will be sending iter amount of money 


print(l)
i = 0	
print()
while(i<numPeople):
	j = 0
	while(j<numPeople):
		if l[i][2][j] != 0:	
			print(l[i][0] + " will request $" + str(l[i][2][j]) + " from " + l[j][0])
			print()
		j+=1
	i+=1
	j=0
print()
