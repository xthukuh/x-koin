LIB = ../../lib
ED = $(LIB)/ed25519
SRCS = test_core.c $(LIB)/xkp/frames.c $(LIB)/xkp/receipt.c $(LIB)/xkp/medium.c \
       $(LIB)/router/classifier.c $(LIB)/kq130f/kq130f.c $(LIB)/crypto/sha256.c \
       $(ED)/verify.c $(ED)/sc.c $(ED)/fe.c $(ED)/ge.c $(ED)/sha512.c
test_core: $(SRCS) vectors.h
	gcc -O2 -Wall -Wextra -I$(ED) -o $@ $(SRCS)
run: test_core
	./test_core
clean:
	rm -f test_core
