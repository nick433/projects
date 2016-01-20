#include<stdio.h>
#include<stdlib.h>
#include<ctype.h>

int getbin(int gray);
int getgray(int bin);
int poww(int op, int pow);
int decimal_binary(int n);
int binary_decimal(int n);
int main(int argc,char **argv){
void multi(int *table, char *buffer);
void decoder(int *table, char *buffer);
	FILE *pFile1;
	FILE *pFile2;
	pFile1 = fopen(argv[1], "r");
	pFile2 = fopen(argv[2], "r");

	char q = 'q';
	int inputnum;
	while(isalpha(q)){
		fscanf(pFile1,"%c",&q);
	} /* skips past INPUTVAR string */
	fscanf(pFile1,"%d",&inputnum);	/* set inputnum */
	char inputvars[inputnum];
	char buff1;
	int i = 0;
	while(i<inputnum){
		fscanf(pFile1,"%c",&buff1);
		if(isalpha(buff1)){
			inputvars[i] = buff1;
			i++;
		}
	
	} /* used to have 2 fscanfs, one to skip line */
	fscanf(pFile1,"%c",&q); /* skips the empty line */
	q = 'q';	
	int outputnum;
		
	while(isalpha(q)){
		fscanf(pFile1,"%c",&q);
	}
	fscanf(pFile1,"%d",&outputnum);
	char outputvars[outputnum]; 
	i = 0;	
	char mbuffer[1];
	
	while(i<outputnum){
		fscanf(pFile1,"%c",&buff1);
		if(isalpha(buff1)){
			outputvars[i] = buff1;
			i++;
		}		
	}		
	int table[500];
	for(i=0;i<500;i++){
		table[i] = 0;
	}	
	table[48] = 0;
	table[49] = 1; /* 0 and 1 ascii values */
	char buffer[500];
	int inputLines = 0;
	while(fgets(buffer,500,pFile2) != NULL){
		inputLines++;
	}
	rewind(pFile2);
	int inputh[inputnum]; /* holds inputs like 101, for the current iteration */
	int c = 0; /*also try 1 */
	int r = 0;
	char muxin;
	rewind(pFile1);
	fgets(buffer,500,pFile1);
	fgets(buffer,500,pFile1);
	fgets(buffer,500,pFile1);
	char clockvar = buffer[6];
	char holder[20];
	int cnum;	
	fscanf(pFile2,"%s",holder);
	fscanf(pFile2,"%d",&cnum);
	if(holder[0] != clockvar){
		while(fgets(buffer,500,pFile2) != NULL){
			fscanf(pFile2,"%s",holder);
			fscanf(pFile2,"%d",&cnum);
			if(holder[0] == clockvar){
				break;
			}
		}
	}
	
	int clockin[cnum]; //used for clock inputs- should just be 0 1 0 1 0 1 0 1...
	for(i=0;i<cnum;i++){
		fscanf(pFile2,"%d",&clockin[i]);		 /*loads clock input array*/
	}
		
	rewind(pFile2);
	while(fgets(buffer,500,pFile1) != NULL){
		if(buffer[1] == 'F'){
			if(buffer[10] == '1'){
				table[(int)buffer[16]] = 1;
			}	
		}
	}
	
	rewind(pFile1);
	int outputs[outputnum][cnum]; /* 2d array which will hold result */
	for(i = 0;i<outputnum;i++){
		outputs[i][0] = table[(int)outputvars[i]];
	}
	fgets(buffer,500,pFile1);
	fgets(buffer,500,pFile1);
	fgets(buffer,500,pFile1);
	rewind(pFile2);
	int j = 0;
	i = 0;
	int otherinputs[inputLines-1][cnum];
		

	while(i<inputLines-1){	
		fscanf(pFile2,"%s",holder);
		fscanf(pFile2,"%d",&cnum);
	
		if(holder[0] == clockvar){
		
			fgets(buffer,500,pFile2);
			continue;
		}
		else{
			for(j=0;j<cnum;j++){
				fscanf(pFile2,"%d",&otherinputs[i][j]);
			}
			
			i++;	
		}
		if(i==inputLines-1){
			break;
		}
	}
	rewind(pFile2);
	
	
while(c < cnum){
	
	table[(int)clockvar] = clockin[c];	
	int u = 0;
	int ind = 0;
	while(u<inputnum-1){
		if(inputvars[u] != clockvar){
			table[(int)inputvars[u]] = otherinputs[ind][c];
			ind++;
			u++;
		}
		else{ u++;
		}
		if(ind==inputLines-1)
			break;
	}
	
	if(r ==1){
		fgets(buffer,500,pFile1);
		fgets(buffer,500,pFile1);
		fgets(buffer,500,pFile1);
	}
		
	while(fgets(buffer,500,pFile1) != NULL){
	
	/* if input varfile has 'AND a b C' we will use input values to AND the values of a b and store in C.
  I'm only parsing the first letter of the input as a shortcut, this isn't a good idea usually but we were told the test cases would have no errors */
  
		if(buffer[0] == 'A'){
			table[(int)buffer[8]] = table[(int)buffer[4]] & table[(int)buffer[6]];
		}
		else if(buffer[0] == 'O'){
			table[(int)buffer[7]] = table[(int)buffer[3]] | table[(int)buffer[5]];
		}
		else if(buffer[0] == 'N'){
			table[(int)buffer[6]] = !table[(int)buffer[4]];
		}
		else if(buffer[0] == 'M'){
			multi(table,buffer);
		}
		else if(buffer[1] == 'F'){ /* dflip */
			if(table[(int)clockvar] == 1){
				table[(int)buffer[16]] = table[(int)buffer[12]];
			}	
		}	
		else if(buffer[0] == 'D'){
			decoder(table,buffer);
		}
	}
	i = 0;
	while(i<outputnum){
			outputs[i][c] = table[(int)outputvars[i]];
			i++;
		}

	c++;
	r = 1;
	rewind(pFile1);
}
j = 0;
i = 0;
while(i < outputnum){
	j = 0;
	printf("%c: ",outputvars[i]);
	while(j < cnum){
		printf("%d ",outputs[i][j]);
		j++;
	}
	printf("\n");
	i++;
}

}
void decoder(int *table, char *buffer){

		int count = 0;
		int i = 8;
		while(isdigit(buffer[i])){
			count++;
			i++;
		}
		
		char inparr[count];
		i = 8;
		int i1 = 0;
		while(i1<count){
			inparr[i1] = buffer[i];
			i1++;
			i++;
		}
		int inpnum = atoi(inparr);
		int outnum = poww(2,inpnum);
		char inputvars[inpnum];
		char outputvars[outnum];
		int o = i + 1;
		i = 0;
		while(i<inpnum){
			inputvars[i] = buffer[o];
			i++;
			o = o+2;
		}
		i=0;
		while(i<outnum){
			outputvars[i] = buffer[o];
			table[(int)outputvars[i]] = 0; /*set default for outputs to 0 */
			i++;	
			o = o+2;
		}
		i = 0;
		int select[inpnum];		
		while(i<inpnum){
			select[i] = table[(int)inputvars[i]];
			i++;
		}
		int selected = 0;
		for (i = 0; i < inpnum; i++){
 			selected = 10 * selected + select[i];
		}
		int gray = getbin(selected);
		int dex = binary_decimal(gray);
		table[(int)outputvars[dex]] = 1;

}
void multi(int *table, char *buffer){

			
		int count = 0;
		int i = 12;
		while(isdigit(buffer[i])){
			count++;
			i++;
		}
		
		char inparr[count];
		i = 12;
		int i1 = 0;
		while(i1<count){
			inparr[i1] = buffer[i];
			i1++;
			i++;
		}
		int muxnum = atoi(inparr);
		int selectnum = 0;
		int j = 1;
		while(j<muxnum){
			j = j*2;							
			selectnum++;
		}
		
		char selecters[selectnum];
		char muxinputs[muxnum];
		int o = i+1;
		i = 0;
		while(i<muxnum){
			muxinputs[i] = buffer[o];
			o = o+2;	
			i++;
		}
		i = 0;
		while(i<selectnum){
			selecters[i] = buffer[o]; 	
			o = o+2;
			i++;
		}
		int select[selectnum];
		i = 0;
		while(i<selectnum){
			select[i] = table[(int)selecters[i]];
			i++;
		}
		int selected = 0;
		for (i = 0; i < selectnum; i++){
 			selected = 10 * selected + select[i];
		}
		
		int gray = getbin(selected);
		int dex = binary_decimal(gray);
			
		table[(int)buffer[o]] = table[(int)muxinputs[dex]];
		 
}
int getgray(int bin){
	int a, b;
	int result = 0;
	int i = 0;
 
	while (bin != 0){
        	a = bin % 10;
       		bin = bin / 10;
        	b = bin % 10;
        	if ((a && !b) || (!a && b)){
        		result = result + poww(10, i);
      		}
        i++;
	}
	return result;
}


int getbin(int gray){
	int a[10],i=0,c=0;
	while(gray!=0){ 
		a[i]=gray%10;
		gray/=10;
		i++;
		c++;
	}
	for(i=c-1;i>=0;i--){
		if(a[i]==1){
			if(a[i-1]==1)
				a[i-1]=0;
			else
				a[i-1]=1;
		}
	}

	int k = 0;
	for (i = c-1; i >= 0; i--)
    		k = 10 * k + a[i];

	return k;
	
}

int poww(int op, int pow){
	if(pow == 0){
		return 1;
	}
	if(pow == 1){
		return op;
	}
	int same = op;
	int i;
	for(i = 0;i<pow-1;i++){
		same = same*op;
	}
	return same;
}
int binary_decimal(int n){
    int decimal=0, i=0, r;
    while (n!=0)
    {
        r = n%10;
        n/=10;
        decimal += r*poww(2,i);
        ++i;
    }
    return decimal;
}

int decimal_binary(int n){
    int r, i=1, binary=0;
    while (n!=0)
    {
        r=n%2;
        n/=2;
        binary += r*i;
        i*=10;
    }
    return binary;
}
