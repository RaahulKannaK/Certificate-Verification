import cv2

print("OpenCV version:", cv2.__version__)

img = cv2.imread("D:/raahulkanna/New Desktop/blockchain-credential-system/test.jpg")

if img is None:
    print("Image not found")
else:
    cv2.imshow("Image", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
