import java.io.*;
import java.util.*;
//import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.text.DateFormat;
import javax.mail.*;
import javax.mail.internet.*;  


import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;

import java.sql.*; 


public class RemindMain implements Runnable{
	static int num = 0; //just for testing threads
	static ArrayList<String> data = new ArrayList<String>();
	static int callCount = 0;
	static boolean sleep = false;
	static int sleepMins = 0;
	static boolean print = false;
	static boolean deleteAll = false;
	static boolean end = false;
	static int result;
	static String p = "";
	
    public static void main(String[] args) throws InterruptedException, FileNotFoundException{
    	
    	(new Thread(new RemindMain())).start();
    	
        
    	stub();
    	

 
    }
    public static void stub(){
    	try{ 
    		String url = "jdbc:mysql://localhost:3306/databases?autoReconnect=true&useSSL=false";
    		Connection conn = DriverManager.getConnection(url, "root", "Nicholas9"); //password for the 
    		
    		Statement stmt = conn.createStatement(ResultSet.TYPE_SCROLL_INSENSITIVE,ResultSet.CONCUR_UPDATABLE);

    		// if there happens to be nothing in the database keep looping, starting HERE

    		ResultSet rs = stmt.executeQuery("select * from reminders;");
    		    		
   			DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss.SSS");
   			
   		
   			
   			
    		//delete this later
    		
    		
    		//then we wanna check if there was any commands sent to add or delete shit from the database
 
//    		int result; //result of deletion
    		
    		while(rs.next()){
    			System.out.println(rs.getString("clock")); 
    		}
    		while(true){
    			System.out.println("data: " + data);
	    		if(data.size() != 0){
	    			for(int i = 0; i < data.size();i++){
	    				System.out.println("data wasnt 0");
	    				System.out.println("data.tostring " + data.get(i).toString());
	    				Calendar cal = getTimestamp(data.get(i).toString());
	    				if(cal == null){
	    					break;
	    				}
	    				String msgtxt = data.get(i).substring(data.get(i).indexOf(";") + 2 , data.get(i).length()); //-2 because the end of the msg includes a /n
	    				
	    				System.out.println("cal2dateformat: " + dateFormat.format(cal.getTime()).toString());
	    				java.util.Date date = new SimpleDateFormat(
	    						"yyyy/MM/dd HH:mm:ss").parse(dateFormat.format(cal.getTime()).toString());
	    	    		System.out.println("date: " + date);
	    	    		java.sql.Timestamp ts = new Timestamp(date.getTime());
	    	    		System.out.println("ts: " + ts.toString());
	    				//somewhere in this area: use the getTimestamp() to take the msg and extract the date part.
	    				//then delete everything up until the ';'. then put the reminder and time into the database
	    				
	    				//after that check if any of the things in the database have a time later or equal to the current time
	    				
	    	    		
	    	    		System.out.println("adding...");
	    	    		System.out.println("msgtxt: " + msgtxt);
	    				rs.moveToInsertRow();
	    				rs.updateString("reminder",msgtxt);
	    				rs.updateTimestamp("clock", ts);
	    				rs.updateString("phone","n"); //will need to make a parse check for phone y/n
	    				rs.insertRow();
	    				System.out.println("adding done");
	    				
		    			
	    			} //end for loop
	    			
	    		}//end data != 0
	    		data.clear();
	    		//now we check to see if any of the databases figures indicate a reason to send a message
	    		
	    			
	    		rs.absolute(0);//set pointer to begining of list
	    		java.util.Date date= new java.util.Date();
	        	java.sql.Timestamp ts_now = new java.sql.Timestamp(date.getTime());
    			while(rs.next() == true){
    				System.out.println("tsnow inloop: " + ts_now);
        			if(ts_now.after(rs.getTimestamp("clock"))){
        				send(rs.getString("reminder"));
        				
    //    					if(call.equals("y")){
    //    						phoneCall(callCount%2);
        						callCount++;	
    //    					}
        				//
        				//		
        				rs.deleteRow(); //there may be a problem with rs.next after you delete a row. test this 
     
        			}
              			 
    			} //end while rs.next
	    		
	    		
	    		
	    		data.clear();
	    		rs.absolute(0); //set pointer back to top of rs
	    		
	    		if(print){ //send important data from table with current prices to phone
    				p = "";
    				while(rs.next()){
    						p = p + rs.getTimestamp("clock") + "\r\n";
    				}
    				send(p);
    				rs.absolute(0);
    				print = false;
    			}
    			if(deleteAll){
    				String sql = "TRUNCATE TABLE reminders";
					PreparedStatement pst = conn.prepareStatement(sql);
					result = pst.executeUpdate();
					if(result == 1){
						System.out.println("error deleting");
						send("error deleting");
					}
					
    			}
	    
	    		if(sleep){
	    			System.out.println("sleeping for " + sleepMins + " minutes in main thread");
	    			Thread.sleep(sleepMins*60000);
	    		}
	    		sleep = false; //the other thread should definitly have had enough time to go to sleep, both will set to false
	    		rs.absolute(0);
	    		Thread.sleep(6000); //to save processing power	
    		
    		} //end while true
    		
    	}    	
    	catch(NoSuchElementException e){ 
    		e.printStackTrace();
    		//send("restarting main thread; NSEe");
    		try {
				Thread.sleep(60000);
			} catch (InterruptedException e1) {
				e1.printStackTrace();
			}
    		stub();
    		
    	}
    	catch(Exception e){ 
    		e.printStackTrace();
    		//send("restarting main thread");
    		try {
				Thread.sleep(60000);
			} catch (InterruptedException e1) {
				e1.printStackTrace();
			}
    		//send("restarting main thread");
    		stub();
    	}
    }
    public static Calendar getTimestamp(String msg){
    	//use string tokenizer. reminder text is after ; 
    	//exmpls of inputs: 3 m ; 2 h 30 m ; 1 m 30 s ; t 12:12:12 ; 6/30/16 20:10:00 ; 18:00:00 ; 6-22-16 9:25:00 ;
    	//t means tomorrows date 
    	// ex return:   2013-04-26 08:34:55.705
    	int month, year, second, minute, day, hour;
    	month = year= second= minute= day= hour = 0;
    	boolean addToCurrTime = false;
    	boolean timeOnly = false;
    	StringTokenizer tk = new StringTokenizer(msg);
    	String s = "";
    	String s2 = "";
    	int in = 0;
    	int a = 0;
    	String temp = "";
    	boolean tomorrow = false;
    	if(!tk.hasMoreTokens()) return null; //if nothing is given
    	while(tk.hasMoreTokens()){
    		s = tk.nextToken();
    		if((s.toLowerCase().charAt(0) == 'p')){
    			print = true;
    			return null;
    		}
    		if((s.toLowerCase().charAt(0) == 'd')){
    			deleteAll = true;
    			return null;
    		}
    		if((s.toLowerCase().charAt(0) == 'e')){
    			System.out.println("ending program");
    			send("ending program");
    			System.exit(0);
    			return null;
    		}
    		if((s.toLowerCase().charAt(0) == 's')){
    			sleep = true;
				sleepMins = Integer.parseInt(tk.nextToken());
    			return null;
    		}
    		
    		if(s.equals(";")){
    			break;
    		}
    		if(!tk.hasMoreTokens()) break; //mistake was made.was return null
    		
    		s2 = tk.nextToken();
    		if(s.equals("t") || s.equals("T")){
    			tomorrow = true;
    			System.out.println("s2: " + s2);
    			if(s2.indexOf(':') != -1){ //time parse
					a = s2.indexOf(':');
					temp = s2.substring(0,a);
					System.out.println("temp: " + temp);
					hour = Integer.parseInt(temp);
					s2 = s2.substring(a+1);
					a = s2.indexOf(':');
					temp = s2.substring(0,a);
					minute = Integer.parseInt(temp);
					s2 = s2.substring(a+1);
					second = Integer.parseInt(s2); //at this point s is only the seconds
					break;
				}
    			
    		}
    		
    		//if(s2.equals(";")){
    		//	break;
    		//} find alternative for this
    		if(Character.isLetter(s2.charAt(0))){ //first char of token should only be a letter when specifying time from present
    			addToCurrTime = true; //will have to add time values to the current date for storing 
    			in = Integer.parseInt(s);
    			if(s2.charAt(0)=='m'){
    				minute = in;
    			}
    			else if(s2.charAt(0)=='h'){
    				hour = in;
    			}
    			else if(s2.charAt(0)=='s'){
    				second = in;
    			}
    		}
    		else if(s.indexOf('/') != -1){ //date parse followed by time parse for s2
    				a = s.indexOf('/');
    				temp = s.substring(0,a);
    				month = Integer.parseInt(temp);
    				s = s.substring(a+1);
    				a = s.indexOf('/');
    				temp = s.substring(0,a);
    				day = Integer.parseInt(temp);
    				s = s.substring(a+1);
    				year = Integer.parseInt(s); //at this point s is only the seconds
    				if(year < 2000){
    					year+=2000;
    				}
    			
    				if(s2.indexOf(':') != -1){ //time parse
    					a = s2.indexOf(':');
    					temp = s2.substring(0,a);
    					System.out.println("temp: " + temp);
    					hour = Integer.parseInt(temp);
    					s2 = s2.substring(a+1);
    					a = s2.indexOf(':');
    					temp = s2.substring(0,a);
    					minute = Integer.parseInt(temp);
    					s2 = s2.substring(a+1);
    					second = Integer.parseInt(s2); //at this point s is only the seconds
    					break;
    				}	
    				
    		}
    		else{ //only first token is the time
    			if(s.indexOf(':') != -1){ //time parse
    				a = s.indexOf(':');
    				temp = s.substring(0,a);
    				hour = Integer.parseInt(temp);
    				s = s.substring(a+1);
    				a = s.indexOf(':');
    				temp = s.substring(0,a);
    				minute = Integer.parseInt(temp);
    				s = s.substring(a+1);
    				second = Integer.parseInt(s); //at this point s is only the seconds
    				timeOnly = true;
    				break;
    			}
    			break; 
    		}
    		
    	} //end while
    	System.out.println("time: " + hour + minute + second + " date: " + month + day + year);
    	DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss"); //this is the format that will be saved to the sql database
		Calendar cal = Calendar.getInstance();
		if(addToCurrTime){
			
			cal.add(Calendar.MINUTE, minute);
			cal.add(Calendar.SECOND, second);
			cal.add(Calendar.HOUR_OF_DAY, hour);
			System.out.println("nowwcal: "+ cal.getTime()); //might return this instead of cal
			System.out.println("nowww: " + dateFormat.format(cal.getTime())); //might return this instead of cal
			return cal;
    	}
		else if(tomorrow){
			cal.set(Calendar.MINUTE, minute);
			cal.set(Calendar.SECOND, second);
			cal.set(Calendar.HOUR_OF_DAY, hour);
			cal.add(Calendar.DAY_OF_MONTH, 1);
			System.out.println("nowwcal: "+ cal.getTime()); //might return this instead of cal
			System.out.println("nowww: " + dateFormat.format(cal.getTime())); //might return this instead of cal
			return cal;
		}
		else if(timeOnly){
			cal.set(Calendar.MINUTE, minute);
			cal.set(Calendar.SECOND, second);
			cal.set(Calendar.HOUR_OF_DAY, hour);
			System.out.println("nowww: " + dateFormat.format(cal.getTime())); //might return this instead of cal
			return cal;
		}
		else{ 
			cal.set(year, month, day, hour, minute, second);
			System.out.println("nowww: " + dateFormat.format(cal.getTime())); //might return this instead of cal
			return cal;
		}
    
    } //ideally we want to set the format of the date to something sql can be compatable with to do date arithmetic
    
    public void run(){
	   
    	while (true) {
			try {
		
				System.out.println("mail thread start");
				//data.clear(); clears data from arraylist efficiently
			
				Properties properties = new Properties();
	
				properties.put("mail.pop3.host", "pop.gmail.com");
				properties.put("mail.pop3.port", "995");
				properties.put("mail.pop3.starttls.enable", "true");
				Session emailSession = Session.getDefaultInstance(properties);
	
				//create the POP3 store object and connect with the pop server
				Store store = emailSession.getStore("pop3s");
	
				store.connect("imap.gmail.com", "GMAIL",
						"PASSWORD");
	
				//create the folder object and open it
				Folder emailFolder = store.getFolder("INBOX");
				emailFolder.open(Folder.READ_ONLY);
	
				// retrieve the messages from the folder in an array and print it
				Message[] messages = emailFolder.getMessages();
				System.out.println("messages.length---" + messages.length);
				String a;
				for (int n = messages.length - 1, i = n; i > n - 5; i--) {
					if (i == -1) //reasoning for this is because javamail api sucks
						break;
					Message message = messages[i];
					a = message.getContent().toString();
					
				//	System.out.println("Email Number " + (i + 1));
				//	System.out.println("Subject: " + message.getSubject());
				//	System.out.println("From: " + message.getFrom()[0]);
					System.out.println("Text: " + a);
					System.out.println("Time: " + message.getSentDate().getTime());
				
					data.add(a.substring(0,a.length()-2)); //cuts off the /n
					//System.out.println(data.get(0));
					
				}
	
				//close the store and folder objects
				emailFolder.close(false);
				store.close();
				Thread.sleep(10000);
				if(sleep){
					send("sleeping for " + sleepMins + " minutes");
					System.out.println("sleeping for " + sleepMins + " minutes in run thread");
	    			Thread.sleep(sleepMins*60000);
	    		}
	    		sleep = false;
			} catch (NoSuchProviderException e) {
				e.printStackTrace();
			
			} catch (MessagingException e) {
				e.printStackTrace();
				
			} catch (Exception e) {
				e.printStackTrace();
				
			}
		}
	   
   }
    
   public static void send(String msg){
    	
    	final String username = "GMAIL";
		final String password = "PASWORD";
 
		Properties props = new Properties();
		props.put("mail.smtp.auth", "true");
		props.put("mail.smtp.starttls.enable", "true");
		props.put("mail.smtp.host", "smtp.gmail.com");
		props.put("mail.smtp.port", "587");
 
		Session session = Session.getInstance(props,
		  new javax.mail.Authenticator() {
			protected PasswordAuthentication getPasswordAuthentication() {
				return new PasswordAuthentication(username, password);
			}
		  });
 
		try {
 
			Message message = new MimeMessage(session);
			message.setFrom(new InternetAddress(username));
			message.setRecipients(Message.RecipientType.TO,
				InternetAddress.parse("xxxxxxxxxx@vtext.com")); //phone number
			//message.setSubject("Testing Subject"); //check if this can be removed
			message.setText(msg);
 
			Transport.send(message);
 
			System.out.println("msg sent");
 
		} catch (MessagingException e) {
			throw new RuntimeException(e);
		}
    }   

    
    public static void phoneCall(int n) throws InterruptedException{
    	
    	System.out.println("Option 1 or option 2?"); 
    	//later on change this so it just cycles through each method (increments i and does %2 on i)
    	
    	
    	
    	if(n == 0){
	    	System.setProperty( "webdriver.chrome.driver", 
	    			"C:/Users/nick1_000/Desktop/APIs/webregJARS/chromedriver.exe");
	    	WebDriver driver = new ChromeDriver();
	 
	    	driver.get("http://www.wheresmycellphone.com/");
	  
	    	Thread.sleep(1000);
	    	WebElement element = driver.findElement(By.name("noArea"));
	    	element.sendKeys(Keys.TAB);
	    	Thread.sleep(1000);
	    	element.sendKeys("732"); //area code
	    	Thread.sleep(1000);
	
	    	
	    	driver.findElement(By.name("noNumb")).sendKeys("xxxxxxx");  //phone number
	    	Thread.sleep(1000);
	    	driver.findElement(By.name("noArea")).sendKeys(Keys.ENTER);
	    	Thread.sleep(10000);
    		             
	    	driver.quit();
	    	
    	}
    	
    	//this is for callmylostphone
    	else if(n == 1){
	    	System.setProperty( "webdriver.chrome.driver", 
	    			"C:/Users/Nicholas/Desktop/chromedriver_win32/chromedriver.exe");
	    	WebDriver driver = new ChromeDriver();
	
	    	driver.get("http://www.callmylostphone.com/");
	    	WebElement element = driver.findElement(By.name("recipient"));
	
	    	element.sendKeys("xxxxxxxxxx");  //phone number
	    	element.submit();	
	    	Thread.sleep(2000);             
	    	
	    	driver.quit();
    	
    	}
    	
    }

}

/*  maybe use timeInMillis for the database
long timeInMillis = System.currentTimeMillis();
Calendar cal1 = Calendar.getInstance();
cal1.setTimeInMillis(timeInMillis);
SimpleDateFormat dateFormat = new SimpleDateFormat(
                                "dd/MM/yyyy hh:mm:ss a");
dateforrow = dateFormat.format(cal1.getTime());
*/
