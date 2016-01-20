
Nick Mangracina(nsm83) and Eddie Lazar(ekl31)
PA5 Readme

Our programs use multiprocessing, shared memory, and memory maps to handle interactions between a user on a client and a bank on a server.

The goal of the user in this program is to access the data in a bank, so our codebase is split up into two parts; one, the server, handles secure access, insertion, and retrieval of sensitive money data between the bank and any client who wants to use it, while the other, the client, handles interactions between the end user and the server. This way, the client cannot see everyone's data, and multiple clients can use the program at once.

The client program spawns a thread that interacts with the user; it takes input via fgets, and scans it to make sure its a legal bank command. If this is verified, it stores the input to be sent to the bank. If not, it instead stores a series of null bytes, which the other thread will recognize as invalid and ask again. Also, the thread sleeps for 2 seconds, so as to throttle user data.
Meanwhile, the other thread gets this user data stored and sends it to the server, and then waits for a series of replies. The server can send back any number of status updates. If the server sends back the string "end", the client knows to stop receiving, and that it is its turn to send some data over. It jumps back to the top of a loop, gets user input, and tries again. This loop is terminated when SIGINT is triggered or a send or receive call fails.

The server program opens and starts waiting for clients to connect to it. Once it detects a connection, it spawns a child process to handle the client's input. This process is the client_servicer function, which reads messages from the client and interprets them as instructions. It recognizes command keywords and executes blocks of code based on the commands and any arguments. After taking receieving a message from the client, the server can send back any number of info messages and then send back the word end, as mentioned, to wait for some input again.

There are three main options a user can enter: open <name>, which starts an account, start<name>, which begins a user session for that account, and exit, which kills the client. 

Open locks the entire bank before checking to make sure the bank is not full and the given name is not already there. Only then does it initialize an account, give it the name, and then unlocks the bank. We lock the bank during open because if two clients try to open, they may try to open accounts in the same Account slot, which causes loss of data. 

Start finds where the given account is, if present at all. Once found, it locks that account, so that no other users can enter it. If another client tries to access it, they will wait and repeatedly check until the account opens up. Once a user is inside an account session, they have 4 options. Credit adds money given by the argument into the account's balance. Debit subtracts money, being careful not to take out more money than is in there. Balance sends the user the balance of the account. Finally, finish quits the session, the account is unlocked, and the user is sent back to the main menu.

We use shared memory in our server function to manage the entire Bank. A global pointer to the Bank struct is kept, which contains an array of Account structs. The bank also a numAccounts field, and a mutex lock. Each Account has a flag for whether it was initialized and whether the Account is in a session, as well as a name, a balance, and a mutex lock for session privacy. 

Since all of the mutex locks are kept in the shared memory, they are accessible between processes, which is key because we use multiprocessing instead of multithreading to handle different client servicers.
