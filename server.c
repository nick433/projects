#include <stdio.h>
#include <stdlib.h>
#include <string.h>    //strlen
#include <sys/socket.h>
#include <arpa/inet.h> //inet_addr
#include <unistd.h>    //write
#include <sys/types.h>
#include <signal.h>
#include <sys/shm.h>
#include <sys/wait.h>
#include <sys/time.h>
#include <sys/ipc.h>
#include <errno.h>
#include <netdb.h>
#include <semaphore.h>
#include <pthread.h>
#include <sys/mman.h>
#include "ser.h"
#include <fcntl.h>

void client_servicer(void *socket_desc);
void create_shm();
int openAccount(char* name);
void startSession(char* name);
void makeBank();
void printBank();

static int gsd;
static int sharedMem;
static Bank * B;
pid_t pid;
const char * end = "end";
const char * killer = "kill";
int sid;

void signalHandler(int signum){

	if(pid == 0){ 
		send(gsd, killer, strlen(killer), 0);
		close(gsd);
		exit(0);
	}
	wait(0);
	//make function that closes all sockets
        
        printf("\n\n\nClosing server. \n");
		
	shmdt(B);
	shmctl(sharedMem, IPC_RMID, NULL);
	
	close(gsd);
	exit(0);
}

int main(int argc , char *argv[]){
	
	signal(SIGINT,signalHandler);
	
	int socket_desc , client_sock , c , *sd;
	struct sockaddr_in server , client;
    
     
	socket_desc = socket(AF_INET , SOCK_STREAM , 0);
	if (socket_desc == -1)
	{
	printf("Could not create socket");
	}
	printf("Socket created\n");

	server.sin_family = AF_INET;
	server.sin_addr.s_addr = inet_addr("127.0.0.1");
	server.sin_port = htons(4022);
     
	
	if( bind(socket_desc,(struct sockaddr *)&server , sizeof(server)) < 0){

		printf("bind failed");
		return 1;
	}
	printf("bind done\n");
     
	if (create_shm(), B == NULL){
		printf("NULL shared mem returned when creating\n");
		return 0;
	}
	
	makeBank();
	
	listen(socket_desc , 3);
     
	printf("Waiting for incoming connections...\n");
	c = sizeof(struct sockaddr_in);
//mmap time
//	Bank *B = (Bank *)shmat((int)(size_t)sid, NULL, 0); 
	Bank *p = malloc(sizeof(Bank));

	
	void *mapm;
	static int pf;
	pf = open("mmap.dat", O_CREAT | O_RDWR | O_EXCL, 0666);

	if(pf == -1){
		pf = open("mmap.dat", O_RDWR);
		mapm = mmap(NULL, sizeof(Bank), PROT_WRITE | PROT_READ, MAP_SHARED, pf, 0);
		memcpy(p, mapm, sizeof(Bank));
	}

	// If the file needs to be created
	else{
		printf("Creating mmap.dat\n");
		if (write(pf, (void*)B, sizeof(Bank)) < 0){
			printf("Cannot write to mmap.dat\n");
		}
		mapm = mmap(NULL, sizeof(Bank), PROT_WRITE, MAP_SHARED, pf, 0);
		memcpy(mapm, B, sizeof(Bank));
	}
	int j;
	for(j = 0; j < 20; j++){
		if (p->accounts[j].init == 1){
			strcpy(B->accounts[j].name, p->accounts[j].name);
			if (strcmp(B->accounts[j].name, "@") == 0)
				strcpy(B->accounts[j].name, "@");
			B->accounts[j].balance = p->accounts[j].balance;
		}
	}
	usleep(2000);
 	pid_t BC = fork();
	while(BC == 0){
		printf("////////////////////////////////////////////////\n\n");
		printBank();
		memcpy(mapm,B,sizeof(4096));		
		printf("\n\n////////////////////////////////////////////\n\n");
		sleep(20);
	}
    
	while( (client_sock = accept(socket_desc, (struct sockaddr *)&client, (socklen_t*)&c)) )
	{

        	sd = malloc(1);
        	*sd = client_sock;
		pid = fork();

		if(pid < 0){ perror("Fork failed"); }

		if(pid == 0){
			printf("Connection accepted\n");
			client_servicer(sd);		
			exit(0);	
		}
 	     	printf("Created child-service process <%d>\n", pid); 
       		printf("Handler assigned\n");
	}
    	
	if (client_sock < 0){
		perror("accept failed");
		return 1;
	}
      
	return 0;
}

void create_shm()
{
	key_t key;

	key = ftok("ser.c", 'R');

	if ((sid = shmget(key, 4096, IPC_CREAT | 0666)) < 0)
	{
		perror("shmget");
		exit(1);
	}
    
	sharedMem = sid;

	if (*(int*)(B = shmat(sid, NULL, 0)) == -1)
	{
	exit(1);
	}

	
}

void client_servicer(void *socket_desc){

	gsd = *(int*)socket_desc;
	int size;
	char *msg , cmessage[200];
	bzero(cmessage, 200);
	
	while( (size = recv(gsd, cmessage , 200 , 0)) > -1 ){
       
		if (cmessage[0] == 'e' && cmessage[1] =='x'){
                
			msg ="Exiting bank, thank you for choosing Nick n Ed's banking :)\n";
			send(gsd,msg,strlen(msg),0);
			usleep(100000);
			send(gsd, end, strlen(end), 0);
			close(gsd);
			exit(0);    	
		}

		char command[100];
		char arg[100];
		
		memset(arg, '\0', 101);
		//printf("arg should be zeroed out. it is \"%s\".\n", arg);
		int last = strlen(cmessage)-1;
		//printf("about to parse cmessage. it is \"%s\".\n", cmessage);
		sscanf(cmessage, "%s %s", command, arg);
		//printf("arg should be the second word in the input. it is \"%s\".\n", arg);
		arg[last-1] = '\0';
//		printf("cmd is \"%s\", args is \"%s\".\n", command, arg); 
		if(strcmp(command, "list") == 0) printBank();
		else if (strcmp(command, "open") == 0){
			printf("Creating new account for %s.\n", arg);
			msg = "Opening account...\n";
//			printf("msg: %s",msg);	
				
			if( send(gsd, msg, strlen(msg), 0) < 0){
				printf("send failed\n");
			}
			
			//int o = 
			while(pthread_mutex_trylock(&(B->lock)) != 0){
				msg = "waiting... bank locked right now...\n";
				
				send(gsd, msg, strlen(msg), 0);
				sleep(1);
			}
			openAccount(arg); //returns 0 on sucess, 1 if too many accounts, 2 if already exists
			
			pthread_mutex_unlock(&B->lock);
			//printf("line: %d\n",__LINE__);		
			//checks to make sure account does already exist
			//also should check that numAccounts<20
        		
			usleep(400000);
			msg ="Enter another command\n";
			send(gsd, msg, strlen(msg), 0);

			//send(gsd, end, strlen(end), 0); //signals clients turn to talk
			//printf("line: %d\n",__LINE__);		
		
			
		}
		else if(strcmp(command, "start") == 0){
			
			if(strcmp(arg, "@") == 0){
				msg = "You have to enter a name...";
				send(gsd, msg, strlen(msg), 0);
			}
			else{
				msg ="Attempting to start your account session...\n";
				send(gsd, msg, strlen(msg), 0);
				int i;
				int flag = 0;	
				for(i = 0; i < 20; i++){
					if(strcmp(arg, B->accounts[i].name)==0){
						flag = 1;
						break;
					}
				}
				//TRY TO LOCK ACCT HERE USING TRYLOCK(). 
				//IF LOCKED, INFORM USER AND GET OUT.
				//ELSE, KEEP CALM AND CARRY ON.
				if(flag){
					while(pthread_mutex_trylock(&(B->accounts[i].lock)) != 0){
						msg = "Waiting to start customer session for account ";
						//strcat(msg, arg);
						send(gsd, msg, strlen(msg), 0);
						send(gsd, arg, strlen(arg), 0);
						sleep(2);
					}
					startSession(arg);
					pthread_mutex_unlock(&(B->accounts[i].lock));
				}
				else{
					msg = "No accounts by that name";
					send(gsd, msg, strlen(msg), 0);
				}
			
			}
		}	
		else{
			msg = "invalid entry, try again silly\n"; 
			send(gsd,msg,strlen(msg),0);
			printBank();
		}
		bzero(cmessage, 200);
		usleep(500000);
		//printf("before\n");	
		send(gsd, end, strlen(end), 0); //signals client's turn to talk
		//printf("after\n");
	}


	if(size == 0)puts("Client manually disconnected. Closing connection.");
	
	else if(size == -1)puts("Receiving failed. Closing connection with client.");

	close(gsd); //changed fro socket_desc
	return;
}

void makeBank(){ //should bzero() names, sett all fields to 0 and initialize mutexes
	//should initialize mutexes here	
	int i;
	//char* msg;
	B->numAccounts = 0;
	for(i = 0; i < 20; i++){
		bzero(B->accounts[i].name,200);
		(B->accounts[i].name)[0] = '@';
		//printf("Name at account %d. Should be the at sign: %s\n", i, B->accounts[i].name);
		B->accounts[i].init = 0;
		B->accounts[i].session = 0;
		B->accounts[i].balance = 0.0;

	}
	return;

}

void printBank(){
	int i;
	for(i = 0; i<20; i++){
		Account acc = B->accounts[i];
		if(acc.init == 1){
			printf("Account number %d: %s.\n", i, acc.name);
			printf("\tBalance: %lf\n", acc.balance);	
		}
	}	

}
int openAccount(char* name){
	//iterates through the sharemem bank to see if any names match, FIRST checks if about num_accounts < 20. returns 2 if name match, 1 if >=20, 0 on succes
	
//	Account this;
	
	//pthread_mutex_lock(&(B->lock));
	
//	printf("line: %d\n",__LINE__);		
	char *msg;
	int i;
//	printf("number of accounts: %d\n",B->numAccounts);
	if(B->numAccounts == 0 ){
		B->accounts[0].init = 1;
		strcpy(B->accounts[0].name, name);
//		printf("print name to make sure : %s\n",B->accounts[0].name);
		msg = "Account made";
		B->numAccounts++;
		send(gsd, msg, strlen(msg), 0);
		//pthread_mutex_unlock(&(B->lock));
		return 0;
	}
	
	else if(B->numAccounts >= 20){
		msg = "Bank cannot make more accounts\n";
		send(gsd, msg, strlen(msg), 0);
		return 1;
	}
	else{
//		printf("Name to search for: %s\n", name);
		for(i = 0; i < 20; i++){
			//printf("Account name at i: %s\n", B->accounts[i].name);
			if(strcmp(B->accounts[i].name, name) == 0){
//				printf("name exists already\n");
				msg = "An account by that name already exists\n";	
				send(gsd, msg, strlen(msg), 0);
				
				//pthread_mutex_unlock(&(B->lock));
				return 2;
			}
		}
	}

//	printf("line: %d\n",__LINE__);		
	for(i = 0; i < 20; i++){
		if(B->accounts[i].init == 0){
			
			strcpy(B->accounts[i].name,name);
			B->accounts[i].init = 1;
			break;	
		} 
	}

	msg = "Account made\n";
	B->numAccounts++;

	send(gsd, msg, strlen(msg), 0);
	//pthread_mutex_unlock(&(B->lock));
	return 0;

}

void startSession(char* name){

//check to see if the account is open, write to client if in session, or if not existing	
//	Account this; //added *
	char* msg;
	
	//this next loop SHOULD be unnecessary. 
	//it will lock outside this function.
	//so anyone who tries to access it should be stopped there.
	//I dont think we need the in session flag. 
	//unless there was another reason i forgot.

	int i;
	for(i = 0; i < 20; i++){
		if(strcmp(B->accounts[i].name, name) == 0){
			//this = B->accounts[i];
			//if(B->accounts[i].session == 1){
			//	msg = "That account is in session.";
			//	send(gsd, msg, strlen(msg), 0);
			//	return;
			//}
	
			break;	//now we know i (index)
		}
	}
	//pthread_mutex_lock(&this.lock);
	
	char input[102];
	bzero(input, 103);
    	msg = "Welcome to your session. \nType balance to see your amount; credit or debit to deposit or withdraw funds; or finish to exit the session.";
	send(gsd, msg, strlen(msg), 0);
	usleep(500000);
	send(gsd, end, strlen(end), 0);
	while(recv(gsd, input, 102, 0)>0){
        	char cmd[10];
		char args[102];
	
		sscanf(input, "%s %s", cmd, args);
		args[strlen(input) - 2] = '\0';
//		printf("cmd is \"%s\", args is \"%s\".\n", cmd, args); 
		
		if(strcmp(cmd, "list") == 0) printBank();
		else if(strcmp(cmd, "credit") == 0){
        		msg = "Crediting your account.";
			send(gsd, msg, strlen(msg),0);
			B->accounts[i].balance += atof(args);
		}

		else if(strcmp(cmd, "debit") == 0){
			double monies = atof(args);
        		msg = "Attempting to debit your account.\n";
			send(gsd, msg, strlen(msg),0);
			if(B->accounts[i].balance - monies < 0){
				msg="Debiting unsuccessful. Insufficient funds.\n";
				send(gsd, msg, strlen(msg), 0);
			}
			else{
				B->accounts[i].balance -= monies;
				msg = "debiting successful.\n";
				send(gsd, msg, strlen(msg), 0);
			}
        	}

		else if(strcmp(cmd, "balance") == 0){
        		msg = "Your account balance: ";
			char amt[20];
			sprintf(amt, "$%.2lf", B->accounts[i].balance);
			send(gsd, msg, strlen(msg), 0);
			send(gsd, amt, strlen(amt), 0);
		}

		else if(strcmp(cmd, "finish") == 0){
			msg = "Finishing session. Have a nice day.";
			send(gsd, msg, strlen(msg), 0);
			usleep(500000);
			//we dont need to send end here because it happens after the function returns. It could be in either spot. It doesnt matter.
			return;
		}
		else {  
			msg = "Not a valid command. Try again.";
			send(gsd, msg, strlen(msg), 0);
		}
		usleep(500000);
		bzero(input, 103);
		send(gsd, end, strlen(end), 0);
   	}

}

