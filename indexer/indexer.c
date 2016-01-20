#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "indexer.h"
#include <dirent.h>

THT *table = NULL;
int items = 0;

//given a text field and an index of where to start, extracts the token that starts there.
//then we make a token and put a list with the filename,1 in it.
int tokenize(int x, char* text, char* filename1){
	
	int size = 1;
	int y = x;
	while(isalnum(text[y+1]) && y < strlen(text)){ //check to make sure thee x+1 doesnt segfault. use strlen on text. maybe add a check to make sure text[x+1] != '\0' as a condition to continue looping
		size++;
		y++;
	}
	int a = 0;
	char tokenName1[size+1];
	while(a<size){
		tokenName1[a] = text[x];
		a++; x++;	
	}
	tokenName1[a] = '\0';

	//all letters in the token must be lowercase
	int index;
	for(index = 0; index < strlen(tokenName1); index++){
		tokenName1[index] = tolower(tokenName1[index]);
	}
	//printf("Token: %s\n", tokenName1);
	
//the purpose of the next few lines is to malloc filename and tokenName.
	
	char *filename = (char*)malloc(strlen(filename1) + 1);
	strcpy(filename,filename1);
	char *tokenName = (char*)malloc(strlen(tokenName1) + 1);
	strcpy(tokenName,tokenName1);
	
	int key = getKey(tokenName);
	if( updateHash( key ,tokenName ,filename) == 0){ //returning 0 if token doesnt already exist and needs to be added		
		items++;
		Token* t = (Token*)malloc(sizeof(Token));
		t->word = tokenName;
		File* f = (File*)malloc(sizeof(File));
		f->freq = 1;
		f->name = filename;
		t->filelist = f;
		if(table[key].head == NULL){
			table[key].head = t;
		}
		else{  //add to head
			t->next = table[key].head;
			table[key].head = t;
		}
		//if(items > (0.8 * numBuckets)) rehash();
	}
	return size;
	
}

/* this function is called when we want to update or create a token.
 * finds that token matching tokenName somewhere in the key bucket, 
 * and either gives it a new file with freq 1 or increments the frequency if the file is there.
 * if not found, returns 0. */
int updateHash(int key,char* tokenName,char* filename){ //returns 0 if token not found, if found, it updates the freq or adds the file with freq 1
	
	if(table[key].head == NULL)
		return 0;
		
	Token* curr = table[key].head;
	

	if(strcmp(curr->word,tokenName) == 0){ //the word already exists in the hashtable, so now add file struct or update it
		if(strcmp(curr->filelist->name,filename) != 0){


			File* f = (File*)malloc(sizeof(File));
			f->next = curr->filelist;
			curr->filelist = f;
			curr->filelist->name = filename;
			curr->filelist->freq = 1;	
			free(tokenName);

		} 
		else{ 
			curr->filelist->freq++;
			free(tokenName); free(filename);
			 //only needed to check first filelist node because the file you are working in would only be added to head
		}
		return 1;
	}
	curr = curr->next;
	while(curr != NULL){
		if(strcmp(curr->word,tokenName) == 0){
			if(strcmp(curr->filelist->name,filename) != 0){
				File* f = (File*)malloc(sizeof(File));
				f->next = curr->filelist;
				curr->filelist = f;
				curr->filelist->name = filename;
				curr->filelist->freq = 1;
				free(tokenName);	
			} 
			else{
				curr->filelist->freq++;
				free(tokenName); free(filename);
			 //only needed to check first filelist node because the file you are working in would only be added to head
			}
			return 1;
		}
		curr = curr->next;
	}	
	return 0;	
}

//given a file pointer, 
//returns the number of characters in it. 
//Includes newlines.
int file2size(FILE* input){
	char c = 'd';
	int x = 0;
	while(1){
		c = fgetc(input);
		if(c == EOF) break;
		x++;
	}
	rewind(input);	
	return x; //may  need to be + 1
}

//hashing function for strings. 
//Sums up ascii values of each character in the string, 
//performs modulus division to get the key.
getKey(char* t){
	int total = 0;
	int hold;
	int i;
	for(i = 0;i<strlen(t);i++){
		hold  = t[i];
		total = total + hold;
	}
	return total % numBuckets; 	
}

int fileTokenizer(char* filename){
	
	FILE *input;
	input = fopen(filename, "r");
	
	//FILE *input = fopen("test1.txt","r");
	if(input == NULL) return 1;	
			
	char text[file2size(input)]; 
	char q = 'd';
	int xx = 0;
	while(1){
		q = fgetc(input);
		if(q == EOF) break;
		text[xx] = q;
		xx++;
	}	

	
	int x = 0;
	char c;	
		
	while(x < strlen(text)){

		c = text[x];
		if(isalpha(c)){
			x += tokenize(x, text, filename); //tokenize returns the length of the token found
		}
		x++;
		
	
	}
	

	return 0;
}


/* This function recursively navigates a directory structure.
 * Given either a directory or a file, it will iterate through
 * the directory and recursively call on any subdirectories.
 * If it ever sees a file, it calls the appropriate function on it
 * to populate the global hash table.*/
void dir_nav(char* a){
	//open it
	DIR* d = opendir(a);
	
	//get a string of this directory's path. WIll come in handy later.
	char temp[256];
	strcpy(temp, a);
	
	if(d == NULL){//RECURSIVE BASE CASE. LEAF NODE. Could be a file, or not exist.
		if(fileTokenizer(a) == 1){
			printf("File %s  does not exist.\n", a);
			exit(1);
		}
		return;
	}	
	//definitely a subdirectory. create a variable to loop through it.
	struct dirent* curr;
	
	//loop iterates and checks if it reached the end
	while((curr = readdir(d)) != NULL){
		//we dont want to recurse on this directory again, or this one'e parent. Skip these.	
		if(!strcmp(curr->d_name, ".") || !strcmp(curr->d_name, "..")){
			continue;
		}
		//gather the string to recurse deeper
		strcat(strcat(a, "/"), curr->d_name);
		//recurse
		dir_nav(a);
		//reset the string a so that the other files in this directory can be reached.
		//This is necessary because strcat() overwrites a, so we have to keep a temporary value of what it was.
		strcpy(a, temp);

	}
}

void printHashTable(){
	int curbuc = 0;//"current bucket"
	for(curbuc = 0; curbuc<1000; curbuc++){
		if(table[curbuc].head == NULL) continue;
		Token* curr = table[curbuc].head;
		while(curr != NULL){
			printf("Bin#%d = %s\n",curbuc, curr->word);
			File* curtain = curr->filelist;
			printf("\t");
			while(curtain!=NULL){
				printf("File: %s, Frequency: %d; ", curtain->name, curtain->freq);
				curtain = curtain->next;
			}
			printf("\n");
			curr = curr->next;
		}
	}
}

void siftDown(Token** a, int start, int end){

	int root = start;
	while(root*2 + 1 <= end){
		int child = root*2 + 1;
		if(child + 1 <= end && 	strcmp(a[child]->word, a[child+1]->word)<0){
			child++;
		}
		if(strcmp(a[root]->word, a[child]->word)<0){
			Token* temp = a[root];
			a[root] = a[child];
			a[child] = temp;
			root = child;
		}
		else{
			return;
		}
	}
	//end siftDown
}

void heapify(Token** a){

	int start = (items-2)/2;
	while(start >= 0){
		siftDown(a, start, items-1);
		start -= 1;
	}
}

void heapsort(Token** array){
	
	heapify(array);
	
	printf("\n\narray is heapified: ");
	int i;
	for(i = 0; i < items; i++) printf("%s, ", array[i]->word);
	
	int end = items - 1;
	while(end > 0){
		Token* temp = array[0];
		array[0] = array[end];
		array[end] = temp;
		end--;
		siftDown(array, 0, end);
	}

}
//////////////////////////////////////////////////////////////////////////////////
void siftDown2(File** a, int start, int end){

	int root = start;
	while(root*2 + 1 <= end){
		int child = root*2 + 1;


/////////////////////////////////////////////////////////////////////////////

		if( (a[child]->freq == a[child+1]->freq) ||  (a[root]->freq == a[child]->freq) ){
			if(child + 1 <= end && ( strcmp(a[child]->name,a[child+1]->name) < 0 ) ){
				child++;
			}
			if(strcmp(a[root]->name,a[child]->name) < 0){
				File* temp = a[root];
				a[root] = a[child];
				a[child] = temp;
				root = child;
			}

		}

///////////////////////////////////////////////////////////////////////////		
		if(child + 1 <= end && 	( a[child]->freq > a[child+1]->freq ) ){
			child++;
		}
		if(a[root]->freq > a[child]->freq){
			File* temp = a[root];
			a[root] = a[child];
			a[child] = temp;
			root = child;
		}


		else{
			return;
		}
		

	}
	//end siftDown
}

void heapify2(File** a, int length){

	int start = (length-2)/2;
	while(start >= 0){
		siftDown2(a, start, length-1);
		start -= 1;
	}
	
	printf(":: %d\n",__LINE__);
}

void heapsort2(File** files,int length){
	
	
	printf(":: %d\n",__LINE__);
	heapify2(files, length);
	
	printf(":: %d\n",__LINE__);
	printf("\n\narray is heapified: ");
	int i;
	for(i = 0; i < length; i++) printf("%d, ", files[i]->freq);
	printf(":: %d\n",__LINE__);
	printf("\n");
	int end = length - 1;
	while(end > 0){
		File* temp = files[0];
		files[0] = files[end];
		files[end] = temp;
		end--;
		siftDown2(files, 0, end);
	}

}
void sapf(Token* t,FILE* output){

	
	File* curr = t->filelist;
	int length = 0;
	while(curr != NULL){
		length++;
		curr = curr->next;
	}
	File* files[length];
	
	File* cur = t->filelist;
	int i = 0;
	while(cur!=NULL){
		files[i] = cur;
		i++;
		cur = cur->next;
	}
	
	printf(":: %d\n",__LINE__);
	heapsort2(files,length);

	printf(":: %d\n",__LINE__);
	//CREATE AN ARRAY OUT OF THE LINKED LIST OF FILES, AND SORT IT.
	//WE ALSO NEED THE LENGTH OF THE LIST
	for(i=0;i<length;i++){
		fprintf(output, "\t\t{\"%s\" : %d}", files[i]->name, files[i]->freq);
		if(i+1 != length) fprintf(output, ",");
		fprintf(output, "\n");
	}

}

int main(int argc, char** argv){

	if(argc != 3){
		printf("Incorrect amount of arguments. Exiting.\n");
		exit(0);
	}


	//CREATE HASH TABLE	
	table = (THT *)calloc(1000, sizeof (THT));
	numBuckets = 1000; 
	dir_nav(argv[2]);//populates hash table

	
	printHashTable();


	//SORT IT
	
	Token* array[items];
	//iterate through hash buckets. for each one, iterate through LL and send each token ptr to the array
	int curbuc = 0;
	int i = 0;
	
	for(curbuc = 0; curbuc < numBuckets; curbuc++){
		if(table[curbuc].head == NULL) continue;
		Token* curr = table[curbuc].head;
		while(curr!=NULL){
			array[i] = curr;
			i++;
			curr = curr->next;
		}
	}
	printf("\nUnsorted array: ");	
	for(i = 0; i < items; i++) printf("%s, ",array[i]->word);

	heapsort(array);
	printf("\n\n\n\n\nSORTED: ");	
	for(i = 0; i < items; i++) printf("%s, ",array[i]->word);
	printf("\n");
	////////////////WRITE TO OUTPUT FILE
	FILE *output;
	output = fopen(argv[1], "w");
	
	int u;
	fprintf(output, "{\"list\" : [\n");
	for(u = 0; u < items; u++){
		fprintf(output, "\t{\"%s\" : [\n", array[u]->word);
		
		sapf(array[u],output); //////////////////////////////////
		
		fprintf(output, "\t]}");
		if(u != items -1) fprintf(output, ",");
		fprintf(output, "\n");
	}
	fprintf(output, "]}");
	fclose(output);



	return 0;
}
