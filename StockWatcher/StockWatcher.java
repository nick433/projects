import java.io.*;
import java.util.*;

import javax.mail.*;
import javax.mail.internet.*;  

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;

import java.sql.*; 


public class StockWatcher implements Runnable{

	static int num = 0; //just for testing threads
	static ArrayList<String> data = new ArrayList<String>();
	static int callCount = 0;
	static boolean sleep = false;
	static int sleepMins = 0;
	
    public static void main(String[] args) throws InterruptedException, FileNotFoundException {
    	
    	(new Thread(new StockMain())).start();
    	
     	//stub is made so if an error occurs it will restart the program
    	stub();
    	

 
    }
    public static void stub(){
    	try{ 
    		String url = "jdbc:mysql://localhost:3306/databases?autoReconnect=true&useSSL=false";
    		Connection conn = DriverManager.getConnection(url, "root", "Nicholas9"); //password for the 
    		
    		Statement stmt = conn.createStatement(ResultSet.TYPE_SCROLL_INSENSITIVE,ResultSet.CONCUR_UPDATABLE);

    		// if there happens to be nothing in the database keep looping, starting HERE

    		ResultSet rs = stmt.executeQuery("select * from stocks;");
    		
    		//first we wanna query database to see if any actions need to be taken
    		 
    		
    		
    		
    		//then we wanna check if there was any commands sent to add or delete shit from the database
    		String qTicker;
    		double qPrice;
    		String qAB; //above/below
    		String qCall = "n";
    		boolean print = false;
    		int result; //result of deletion
    		//int numRows = 0;
    		while(rs.next()){
    			System.out.println(rs.getString("ticker")); 
    		//	numRows++;
    		}
    		while(true){
    			System.out.println(data);
	    		if(data.size() != 0){
	    			for(int i = 0; i < data.size();i++){
	    				String data2 = data.get(i).substring(1, data.get(i).length()-2);
	    				System.out.println("data wasnt 0");
	    				StringTokenizer queries = new StringTokenizer(data2);
	    				if(!queries.hasMoreElements() ){
							send("You fucked up the syntax. Example: .a abc 2 b n == *period ticker add/delete price above/belowthat call?");
						}
	    				
	    				String choice = queries.nextToken();
	    				
	    				if(choice.equals("a")){
	    					System.out.println("adding...");
	    					
	    					qTicker = queries.nextToken();
	    					qPrice = Double.parseDouble(queries.nextToken());
	    					qAB = queries.nextToken();
	    					qCall = queries.nextToken();
	    					
	    					rs.moveToInsertRow();
	    		    		rs.updateString("ticker", qTicker);
	    		    		rs.updateDouble("price", qPrice);
	    		    		rs.updateString("AB", qAB);
	    		    		rs.updateString("phone", qCall);
	    		    		rs.insertRow();
	    		    		System.out.println("adding done"); send("added");
	    				}
	    				else if(choice.equals("d")){ //delete uses prepared stmts, add does not
	    					System.out.println("deleting...");
	    					qTicker = queries.nextToken();	
	    					if(queries.hasMoreElements()){ //case where a price is specified to delete
	    						qPrice = Double.parseDouble(queries.nextToken());
	    						String sql = "Delete from stocks where ticker = ? and price = ?";
	    						PreparedStatement pst = conn.prepareStatement(sql);
	    						pst.setString(1, qTicker);
	    						pst.setDouble(2, qPrice);
	    						result = pst.executeUpdate();
	    						if(result != 1){
	    							System.out.println("error deleting with price");
	    							send("error deleting with price");
	    						}
	    					}
	    					else{
	    						String sql = "delete from stocks where ticker = ?";
	    					
	    						PreparedStatement pst = conn.prepareStatement(sql);
	    						pst.setString(1, qTicker); //number corresponds with which # ? in prepstat
	    						result = pst.executeUpdate();
	    						if(result != 1){
	    							System.out.println("error deleting");
	    							send("error deleting");
	    						}
	    					}
	    					if(result == 1) {
	    						System.out.println("deleting done"); 
	    						send("deleted"); 
	    					}
	    					
	    				} //end delete
	    				else if(choice.equals("p")){
	    					print = true;
	    				}
	    				else if(choice.equals("s")){
	    					sleep = true;
	    					sleepMins = Integer.parseInt(queries.nextToken());
	    				}
	    				else if(choice.equals("e")){
	    					send("program ended");
	    					System.out.println("ending program");
	    					System.exit(0); //ends program
	    				}
	    				else{ send("listen mate ya fucked up the syntax ya hear?");
	    				}
	    			}//end for loop
	    			
	    		}//end data != 0
	    		data.clear();
	    		//now we check to see if any of the databases figures indicate a reason to send a message
	    		
	    		double currPrice;
	    		String call;
	    		
	    		rs.absolute(0);//set pointer to begining of list
	    		
    			while(rs.next() == true){
    				call = rs.getString("phone");
        			currPrice = StockQuote.priceOf(rs.getString("ticker"));
        			if(rs.getString("AB").equals("b")){
        				if(currPrice <= Double.parseDouble(rs.getString("price")) ){
        					send(StockQuote.nameOf(rs.getString("ticker")) + " (" + rs.getString("ticker") + ") has fallen to " + currPrice);
        					if(call.equals("y")){
        						phoneCall(callCount%2);
        						callCount++;	
        					}
        					rs.deleteRow();
        				}
        			}
        			else if(rs.getString("AB").equals("a")){
        				if(currPrice >= Double.parseDouble(rs.getString("price")) ){
        					send(StockQuote.nameOf(rs.getString("ticker")) + " (" + rs.getString("ticker") + ") has risen to " + currPrice);
        					if(call.equals("y")){
        						phoneCall(callCount%2);
        						callCount++;
        					}
        					rs.deleteRow();
        				}
        				
        			}
        		}
	            
    			rs.absolute(0);
    			
    			if(print){ //send important data from table with current prices to phone
    				String p = "";
    				while(rs.next()){
    					p = p + rs.getString("ticker") + " " + rs.getString("AB") + " " + rs.getString("phone") + " " +
    							rs.getString("price") + " now: " + StockQuote.priceOf(rs.getString("ticker")) + "\r\n";
    				}
    				send(p);
    				rs.absolute(0);
    				print = false;
    			}
    			
	    		Thread.sleep(6000); //change this to a bigger interval later to save processing power
	    		if(sleep){
	    			System.out.println("sleeping for " + sleepMins + " minutes in main thread");
	    			Thread.sleep(sleepMins*60000);
	    		}
	    		sleep = false; //the other thread should definitly have had enough time to go to sleep, both will set to false
    		} //end while true
    	
    	}    	
    	catch(NoSuchElementException e){ 
    		e.printStackTrace();
    		send("restarting main thread; NSEe");
    		try {
				Thread.sleep(60000);
			} catch (InterruptedException e1) {
				e1.printStackTrace();
			}
    		stub();
    		
    	}
    	catch(Exception e){ 
    		e.printStackTrace();
    		send("restarting main thread");
    		try {
				Thread.sleep(60000);
			} catch (InterruptedException e1) {
				e1.printStackTrace();
			}
    		send("restarting main thread");
    		stub();
    	}
    }
    public void run(){
	   
    	while (true) {
			try {
		
				System.out.println("thread start");
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
					
					if(a.charAt(0) == '.'){ //it's guaranteed to not be that 1 message 
						//that wont be deleted. all the msgs it checks it internally marks as checked except for the first one
						data.add(a);
					}
					
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
		final String password = "PASSWORD";
 
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
				InternetAddress.parse("xxxxxxxxxxx")); //phone number
			//message.setSubject("Testing Subject"); //check if this can be removed
			message.setText(msg);
 
			Transport.send(message);
 
			System.out.println("msg sent");
 
		} catch (MessagingException e) {
			throw new RuntimeException(e);
		}
    }   

   public static void check() 
		   {
		      
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
	
	    	
	    	driver.findElement(By.name("noNumb")).sendKeys("xxxxxxx"); //phone number
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
	
	    	element.sendKeys("xxxxxxxxxx"); //phone number
	    	element.submit();	
	    	Thread.sleep(2000);             
	    	
	    	driver.quit();
    	
    	}
    	
    }

}
