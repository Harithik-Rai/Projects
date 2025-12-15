import java.util.Random;
import java.util.*;
import java.io.*;

class test{

    public static void main(String []args){
        
        int[] firstArray = new int[1000]; //A1
        for (int i = 0; i < 1000; i++) {
            firstArray[i] = i + 1;
        }
    
        int[] secondArray = new int[1000]; //A2
        for (int i = 0; i < 1000; i++) {
            secondArray[i] = 1000 - i;
        }
    
        int[] thirdArray = new int[1000]; //A3
        Random random = new Random();
        for (int i = 0; i < 1000; i++) {
            thirdArray[i] = random.nextInt(1000) + 1;
        }

        Long startTime = System.currentTimeMillis();

        //BLIND TESTS
        //int result = Blind.CountInversions(firstArray);
        //int result = Blind.CountInversions(secondArray);
        //int result = Blind.CountInversions(thirdArray);

        //INSERTION TESTS
        //int result = Insertion.CountInversions(firstArray);
        //int result = Insertion.CountInversions(secondArray);
        //int result = Insertion.CountInversions(thirdArray);

        //MERGE TESTS
        //int result = Merge.mergeSortAndCount(firstArray, 0, firstArray.length - 1);
        //int result = Merge.mergeSortAndCount(secondArray, 0, secondArray.length - 1);
        int result = Merge.mergeSortAndCount(thirdArray, 0, thirdArray.length - 1);

        
        System.out.println(result);
        long endTime = System.currentTimeMillis();
        double timeml = (endTime-startTime)/100.0;
        System.out.printf("Merge A3, Total Time%.4f\n", timeml);
        

    }
}