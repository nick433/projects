#include <stdlib.h>

//STRUCT DEFINTIONS

/* 
 * Recursive linked list implementation for files.
 * Each file contains its name as a string,
 * an integer representing frequency of a token,
 * and a pointer to another file struct.
 */
typedef struct _file{
	char* name;
	int freq;
	struct _file* next;
} File;

/* 
 * Recursive linked list implementation for tokens.
 * Each one has the token itself as a string, 
 * a list of the files it appears in,
 * and a  pointer to another token struct.
 */
typedef struct _token{
	char* word;
	File* filelist; //a "head" for the inner linked list
	struct _token* next;
} Token;

/*
 * standard hash table definition.
 * head and size, thats it, self explanatory.
 */
typedef struct _tokenHashTable{
	Token* head;
} THT;

int numBuckets;


//FUNCTION DECLARATIONS

//heap operations
//void insert(Token t);//insert at last, sift UP
//void pop();//remove first, swap last into first, sift down

//hash table operations
THT makeHashTable();
void rehash();
Token getItem(THT table);
//initialize structs(just set stuff to args/null/0)
File makeFile(char* filename);
Token makeToken(char* name);
