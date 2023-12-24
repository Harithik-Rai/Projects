import java.util.*;
import java.io.*;

public class Blind{

	//This method prints the contents of an int[]
	private static void printArray(int[] arr){
		//Prints out the contents of an array if it is not -1000, with each element in the array on a new line
		for (int i = 0; i < arr.length; i++) {
				System.out.print(arr[i] + " ");
			
		}
	}

	public static int CountInversions(int[] arr){
            int count = 0;

        for(int i = 0; i < (arr.length); i++){
        	for(int k = i; k < arr.length; k++) {
                if(arr[k] < arr[i]) {
                count++;
                }
            }
        }
        return count;
	}

	public static void main(String []args){
			Scanner s;
			if (args.length > 0){
				try{
					s = new Scanner(new File(args[0]));
				} catch(java.io.FileNotFoundException e){
					System.out.printf("Unable to open %s\n",args[0]);
					return;
				}
				System.out.printf("Reading input values from %s.\n",args[0]);
			}else{
				s = new Scanner(System.in);
				System.out.printf("Enter a list of non-negative integers. Enter a negative value to end the list.\n");
			}
			Vector<Integer> inputVector = new Vector<Integer>();
			int v;
			while(s.hasNextInt() && (v = s.nextInt()) >= 0)
				inputVector.add(v);

			int[] array = new int[inputVector.size()];
	
			for (int i = 0; i < array.length; i++)
				array[i] = inputVector.get(i);

			System.out.printf("Read %d values.\n",array.length);
			


			
			int numberOfInversions = CountInversions(array);
			System.out.println(numberOfInversions);
			

			//System.out.printf("Array %s a pair of values which add to 225.\n",pairExists? "contains":"does not contain");
			
		}
}
